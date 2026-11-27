'use client';

import type { Question, Assessment, QuestionInput, AssessmentInput, AssessmentResults } from 'src/services/learning';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import { CurriculumService } from 'src/services/curriculum';
import { LearningAssessmentApi } from 'src/services/learning';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { moveItem } from '../utils';
import { QUESTION_TYPE_LABEL, LearningQuestionDialog } from '../learning-question-dialog';

// ----------------------------------------------------------------------

type Data = Awaited<ReturnType<typeof LearningAssessmentApi.get>>;

const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const errorOf = (err: any, fallback: string) => err?.message || fallback;

export function LearningAssessmentView({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<'questions' | 'settings' | 'results'>('questions');
  const [dialog, setDialog] = useState<{ open: boolean; question: Question | null; bank: boolean }>({ open: false, question: null, bank: false });
  const [bankOpen, setBankOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(() => {
    LearningAssessmentApi.get(id)
      .then(setData)
      .catch((err) => toast.error(errorOf(err, 'Erro ao carregar a avaliação')));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const { assessment, canEdit, hasSubmissions, questions, course } = data;

  const run = async (fn: () => Promise<unknown>, success?: string) => {
    try {
      await fn();
      if (success) toast.success(success);
    } catch (err) {
      toast.error(errorOf(err, 'Não foi possível salvar'));
      throw err;
    } finally {
      load();
    }
  };

  const saveQuestion = async (input: QuestionInput) => {
    const { question, bank } = dialog;
    await run(
      () =>
        question
          ? LearningAssessmentApi.updateQuestion(question.id, input)
          : bank
            ? LearningAssessmentApi.addBankQuestion(course.id, input)
            : LearningAssessmentApi.addQuestion(assessment.id, input),
      'Questão salva'
    );
  };

  const moveQuestion = (index: number, delta: -1 | 1) => {
    const next = moveItem(questions, index, delta);
    if (next) run(() => LearningAssessmentApi.reorderQuestions(assessment.id, next.map((q) => q.id))).catch(() => {});
  };

  const totalPoints = questions.reduce((s, q) => s + Number(q.points), 0);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={assessment.title}
        links={[
          { name: 'Learning', href: paths.dashboard.learning.root },
          { name: course.name, href: paths.dashboard.learning.course(course.id) },
          { name: assessment.title },
        ]}
        action={
          canEdit ? (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <FormControlLabel
                control={
                  <Switch
                    checked={assessment.published}
                    onChange={(e) => run(() => LearningAssessmentApi.update(assessment.id, { published: e.target.checked }), e.target.checked ? 'Avaliação publicada' : 'Avaliação despublicada').catch(() => {})}
                  />
                }
                label="Publicada"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={!!assessment.resultsReleasedAt}
                    onChange={(e) => run(() => LearningAssessmentApi.release(assessment.id, e.target.checked), e.target.checked ? 'Notas e gabarito liberados' : 'Resultados recolhidos').catch(() => {})}
                  />
                }
                label="Liberar notas e gabarito"
              />
            </Stack>
          ) : null
        }
        sx={{ mb: 2 }}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="questions" label={`Questões (${questions.length})`} />
        <Tab value="settings" label="Configurações" />
        <Tab value="results" label="Resultados" />
      </Tabs>

      {tab === 'questions' && (
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="body2" sx={{ flex: 1, color: 'text.secondary' }}>
              Total: {totalPoints} pontos. A nota vai para o boletim reescalada pela escala do curso.
            </Typography>
            {canEdit && !hasSubmissions && (
              <>
                <Button startIcon={<Iconify icon="solar:library-bold" />} onClick={() => setBankOpen(true)}>
                  Banco de questões
                </Button>
                <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={() => setDialog({ open: true, question: null, bank: false })}>
                  Nova questão
                </Button>
              </>
            )}
          </Stack>
          {!questions.length && <EmptyContent filled title="Nenhuma questão ainda" sx={{ py: 8 }} />}
          {questions.map((q, i) => (
            <Card key={q.id} sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {i + 1}. {QUESTION_TYPE_LABEL[q.type]} · {q.points} pt
                  </Typography>
                  <Box sx={{ typography: 'body2', '& p': { my: 0.5 } }} dangerouslySetInnerHTML={{ __html: q.prompt }} />
                  {q.options && (
                    <Stack spacing={0.25} sx={{ mt: 1 }}>
                      {q.options.map((o) => {
                        const correct = Array.isArray(q.answerKey) ? (q.answerKey as string[]).includes(o.id) : q.answerKey === o.id;
                        return (
                          <Typography key={o.id} variant="body2" sx={{ color: correct ? 'success.main' : 'text.secondary', fontWeight: correct ? 600 : 400 }}>
                            {correct ? '✓ ' : '• '}
                            {o.text}
                          </Typography>
                        );
                      })}
                    </Stack>
                  )}
                  {q.type === 'true_false' && (
                    <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                      Correta: {q.answerKey ? 'Verdadeiro' : 'Falso'}
                    </Typography>
                  )}
                  {q.type === 'short' && (
                    <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                      Aceitas: {Array.isArray(q.answerKey) && q.answerKey.length ? (q.answerKey as string[]).join(', ') : '(correção manual)'}
                    </Typography>
                  )}
                </Box>
                {canEdit && (
                  <Stack direction="row">
                    {!hasSubmissions && (
                      <>
                        <IconButton size="small" disabled={i === 0} onClick={() => moveQuestion(i, -1)}>
                          <Iconify icon="eva:arrow-upward-fill" />
                        </IconButton>
                        <IconButton size="small" disabled={i === questions.length - 1} onClick={() => moveQuestion(i, 1)}>
                          <Iconify icon="eva:arrow-downward-fill" />
                        </IconButton>
                      </>
                    )}
                    <IconButton size="small" onClick={() => setDialog({ open: true, question: q, bank: false })}>
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    {!hasSubmissions && (
                      <IconButton size="small" color="error" onClick={() => run(() => LearningAssessmentApi.deleteQuestion(q.id), 'Questão excluída').catch(() => {})}>
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    )}
                  </Stack>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      {tab === 'settings' && (
        <AssessmentSettings
          assessment={assessment}
          canEdit={canEdit}
          onSave={(input) => run(() => LearningAssessmentApi.update(assessment.id, input), 'Configurações salvas')}
          onDelete={() => setConfirmDelete(true)}
        />
      )}

      {tab === 'results' && <AssessmentResultsTab id={assessment.id} />}

      <LearningQuestionDialog
        open={dialog.open}
        question={dialog.question}
        structureLocked={!!dialog.question && hasSubmissions && !dialog.bank}
        onClose={() => setDialog({ open: false, question: null, bank: false })}
        onSubmit={saveQuestion}
      />

      <QuestionBankDialog
        open={bankOpen}
        courseId={course.id}
        onClose={() => setBankOpen(false)}
        onNew={() => {
          setBankOpen(false);
          setDialog({ open: true, question: null, bank: true });
        }}
        onCopy={(ids) => run(() => LearningAssessmentApi.copyQuestions(assessment.id, ids), 'Questões adicionadas').then(() => setBankOpen(false))}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Excluir avaliação"
        content="As notas já lançadas no boletim continuam lá. Excluir mesmo assim?"
        action={
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              setConfirmDelete(false);
              await LearningAssessmentApi.remove(assessment.id);
              router.replace(paths.dashboard.learning.course(course.id));
            }}
          >
            Excluir
          </Button>
        }
      />
    </DashboardContent>
  );
}

// ---------------------------------------------------------------- configurações

function AssessmentSettings({
  assessment,
  canEdit,
  onSave,
  onDelete,
}: {
  assessment: Assessment;
  canEdit: boolean;
  onSave: (input: AssessmentInput) => Promise<void>;
  onDelete: () => void;
}) {
  const [form, setForm] = useState(() => ({
    title: assessment.title,
    kind: assessment.kind,
    weight: String(assessment.weight),
    subjectId: assessment.subjectId ?? '',
    periodId: assessment.periodId ?? '',
    maxAttempts: String(assessment.maxAttempts),
    timeLimitMin: assessment.timeLimitMin ? String(assessment.timeLimitMin) : '',
    availableFrom: toLocalInput(assessment.availableFrom),
    dueAt: toLocalInput(assessment.dueAt),
    shuffleQuestions: assessment.shuffleQuestions,
    shuffleOptions: assessment.shuffleOptions,
    gradingPolicy: assessment.gradingPolicy,
    syncGrade: assessment.syncGrade,
  }));
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [periods, setPeriods] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    CurriculumService.listCourseSubjects(assessment.courseId)
      .then((r) => setSubjects((r as any).subjects ?? []))
      .catch(() => setSubjects([]));
    CurriculumService.listPeriods(assessment.courseId)
      .then((r) => setPeriods((r as any) ?? []))
      .catch(() => setPeriods([]));
  }, [assessment.courseId]);

  const set = (key: keyof typeof form) => (e: any) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        title: form.title.trim(),
        kind: form.kind.trim() || 'Avaliação',
        weight: Number(form.weight) || 1,
        subjectId: form.subjectId || null,
        periodId: form.periodId || null,
        maxAttempts: Number(form.maxAttempts) || 1,
        timeLimitMin: form.timeLimitMin ? Number(form.timeLimitMin) : null,
        availableFrom: form.availableFrom ? new Date(form.availableFrom).toISOString() : null,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
        shuffleQuestions: form.shuffleQuestions,
        shuffleOptions: form.shuffleOptions,
        gradingPolicy: form.gradingPolicy,
        syncGrade: form.syncGrade,
      });
    } catch {
      // toast já exibido
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <TextField label="Título" value={form.title} onChange={set('title')} fullWidth disabled={!canEdit} />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField label="Tipo no boletim" value={form.kind} onChange={set('kind')} fullWidth disabled={!canEdit} helperText="Ex.: Prova, Trabalho" />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField label="Peso" type="number" value={form.weight} onChange={set('weight')} fullWidth disabled={!canEdit} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField select label="Disciplina (boletim)" value={form.subjectId} onChange={set('subjectId')} fullWidth disabled={!canEdit}>
            <MenuItem value="">Nenhuma</MenuItem>
            {subjects.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField select label="Período (boletim)" value={form.periodId} onChange={set('periodId')} fullWidth disabled={!canEdit}>
            <MenuItem value="">Nenhum</MenuItem>
            {periods.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField label="Tentativas" type="number" value={form.maxAttempts} onChange={set('maxAttempts')} fullWidth disabled={!canEdit} inputProps={{ min: 1, max: 20 }} />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField label="Tempo limite (min)" type="number" value={form.timeLimitMin} onChange={set('timeLimitMin')} fullWidth disabled={!canEdit} helperText="Vazio = sem limite" />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField label="Disponível a partir de" type="datetime-local" value={form.availableFrom} onChange={set('availableFrom')} fullWidth disabled={!canEdit} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField label="Prazo" type="datetime-local" value={form.dueAt} onChange={set('dueAt')} fullWidth disabled={!canEdit} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField select label="Nota que vale" value={form.gradingPolicy} onChange={set('gradingPolicy')} fullWidth disabled={!canEdit}>
            <MenuItem value="highest">Maior nota entre as tentativas</MenuItem>
            <MenuItem value="last">Última tentativa</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={8}>
          <Stack direction="row" flexWrap="wrap">
            <FormControlLabel control={<Switch checked={form.shuffleQuestions} onChange={set('shuffleQuestions')} disabled={!canEdit} />} label="Embaralhar questões" />
            <FormControlLabel control={<Switch checked={form.shuffleOptions} onChange={set('shuffleOptions')} disabled={!canEdit} />} label="Embaralhar alternativas" />
            <FormControlLabel control={<Switch checked={form.syncGrade} onChange={set('syncGrade')} disabled={!canEdit} />} label="Lançar no boletim" />
          </Stack>
        </Grid>
      </Grid>
      {canEdit && (
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
          <Button color="error" onClick={onDelete}>
            Excluir avaliação
          </Button>
          <LoadingButton variant="contained" loading={saving} disabled={!form.title.trim()} onClick={save}>
            Salvar
          </LoadingButton>
        </Stack>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------- resultados

const STATUS_LABEL = { in_progress: 'Em andamento', submitted: 'A corrigir', graded: 'Corrigida' } as const;

function AssessmentResultsTab({ id }: { id: string }) {
  const [results, setResults] = useState<AssessmentResults | null>(null);

  useEffect(() => {
    LearningAssessmentApi.results(id)
      .then(setResults)
      .catch((err) => toast.error(errorOf(err, 'Erro ao carregar resultados')));
  }, [id]);

  if (!results) return <CircularProgress />;
  if (!results.students.length) return <EmptyContent filled title="Nenhum envio ainda" sx={{ py: 8 }} />;

  return (
    <Card>
      <TableContainer>
        <Scrollbar>
          <Table size="small" sx={{ minWidth: 560 }}>
            <TableHead>
              <TableRow>
                <TableCell>Aluno</TableCell>
                <TableCell>Nota no boletim</TableCell>
                <TableCell>Tentativas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.students.map((s) => (
                <TableRow key={s.subscriptionId} hover>
                  <TableCell>{s.studentName}</TableCell>
                  <TableCell>{s.grade ?? '—'}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {s.attempts.map((a) => (
                        <Chip
                          key={a.id}
                          size="small"
                          clickable
                          component={RouterLink}
                          href={paths.dashboard.learning.attempt(a.id)}
                          color={a.status === 'submitted' ? 'warning' : 'default'}
                          label={`#${a.number} ${a.status === 'graded' ? `${a.score}/${a.maxScore}` : STATUS_LABEL[a.status]}`}
                        />
                      ))}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    </Card>
  );
}

// ---------------------------------------------------------------- banco de questões

function QuestionBankDialog({
  open,
  courseId,
  onClose,
  onNew,
  onCopy,
}: {
  open: boolean;
  courseId: string;
  onClose: () => void;
  onNew: () => void;
  onCopy: (ids: string[]) => Promise<void>;
}) {
  const [items, setItems] = useState<Question[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    LearningAssessmentApi.bank(courseId)
      .then(setItems)
      .catch(() => setItems([]));
  }, [open, courseId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Banco de questões do curso</DialogTitle>
      <DialogContent>
        {!items.length && <EmptyContent title="O banco está vazio" sx={{ py: 6 }} />}
        <Stack spacing={1}>
          {items.map((q) => (
            <Stack key={q.id} direction="row" spacing={1} alignItems="flex-start">
              <Checkbox
                checked={selected.includes(q.id)}
                onChange={(e) => setSelected((prev) => (e.target.checked ? [...prev, q.id] : prev.filter((x) => x !== q.id)))}
              />
              <Box sx={{ pt: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {QUESTION_TYPE_LABEL[q.type]} · {q.points} pt
                </Typography>
                <Box sx={{ typography: 'body2', '& p': { my: 0 } }} dangerouslySetInnerHTML={{ __html: q.prompt }} />
              </Box>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onNew} startIcon={<Iconify icon="mingcute:add-line" />} sx={{ mr: 'auto' }}>
          Nova no banco
        </Button>
        <Button onClick={onClose}>Fechar</Button>
        <LoadingButton
          variant="contained"
          loading={saving}
          disabled={!selected.length}
          onClick={async () => {
            setSaving(true);
            try {
              await onCopy(selected);
            } finally {
              setSaving(false);
            }
          }}
        >
          Adicionar {selected.length || ''} à prova
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}


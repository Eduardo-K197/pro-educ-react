'use client';

import type { Grade, CoursePeriod } from 'src/services/grade';
import type { StudentSubscription } from 'src/types/services/student';

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { academicOverview } from 'src/utils/academic-report';
import { downloadAuthenticatedPdf } from 'src/utils/download-document';

import { GradeService } from 'src/services/grade';
import { ApiService } from 'src/services/api/api';
import { CourseService } from 'src/services/course';

import { toast } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useAuthContext } from 'src/auth/hooks';

type Props = { studentId: number; subscriptions?: StudentSubscription[]; initialView?: 'details' | 'overview'; onViewChange?: (view: 'details' | 'overview') => void };
type Setting = { minGrade: number; maxGrade: number; step: number };
const format = (value: number | null) =>
  value === null
    ? '—'
    : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function StudentGradesTab({ studentId, subscriptions = [], initialView = 'details', onViewChange }: Props) {
  const { user } = useAuthContext();
  const canWrite = ['superAdmin', 'admin', 'teacher'].includes(user?.role);
  const courses = useMemo(
    () =>
      Array.from(
        new Map(
          subscriptions
            .map((sub) => sub.course ?? sub.classroom?.course)
            .filter((course): course is { id: string; name: string } => !!course?.id)
            .map((course) => [course.id, course])
        ).values()
      ),
    [subscriptions]
  );
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [periodId, setPeriodId] = useState('');
  const [view, setView] = useState(initialView);
  useEffect(() => { setView(initialView); }, [initialView]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [periods, setPeriods] = useState<CoursePeriod[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [setting, setSetting] = useState<Setting | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadedScope, setLoadedScope] = useState('');
  const [revision, setRevision] = useState(0);
  const [dialog, setDialog] = useState<{ grade?: Grade } | null>(null);
  const [target, setTarget] = useState<Grade | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [form, setForm] = useState({
    subjectId: '',
    periodId: '',
    value: '',
    kind: '',
    weight: '1',
  });
  const scope = `${studentId}:${courseId}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const ready = !loading && !error && loadedScope === scope;

  useEffect(() => {
    if (!courses.some((course) => course.id === courseId)) setCourseId(courses[0]?.id ?? '');
  }, [courses, courseId]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setGrades([]);
    setSubjects([]);
    setPeriods([]);
    setLoadedScope('');
    if (!courseId) {
      setLoading(false);
      return () => controller.abort();
    }
    Promise.all([
      CourseService.getById(courseId, { signal: controller.signal }),
      ApiService.get<{ subjects: { id: string; name: string }[] }>(
        `/courses/${courseId}/subjects`,
        undefined,
        { signal: controller.signal }
      ),
      GradeService.listPeriods(courseId, { signal: controller.signal }),
      GradeService.listForStudent(studentId, { courseId }, { signal: controller.signal }),
    ])
      .then(([course, linked, periodData, gradeData]) => {
        if (controller.signal.aborted) return;
        const list = Array.isArray(linked) ? linked : (linked.subjects ?? []);
        setSubjects(list);
        setPeriods(periodData);
        setSetting((course as typeof course & { gradeSetting?: Setting }).gradeSetting);
        // Keep the student boundary even if an upstream response is malformed.
        setGrades(
          (gradeData.grades ?? []).filter(
            (grade) =>
              Number(grade.studentId ?? grade.subscription?.studentId) === studentId &&
              list.some((subject) => subject.id === grade.subjectId)
          )
        );
        setLoadedScope(scope);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [courseId, studentId, scope, revision]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);
  const overview = useMemo(
    () => academicOverview(subjects, periods, grades),
    [subjects, periods, grades]
  );
  const displayed =
    periodId === '__none__'
      ? grades.filter((grade) => !grade.periodId)
      : grades.filter((grade) => !periodId || grade.periodId === periodId);
  const changeCourse = (id: string) => {
    setCourseId(id);
    setPeriodId('');
    setDialog(null);
    setTarget(null);
  };
  const open = (grade?: Grade) => {
    setForm({
      subjectId: grade?.subjectId ?? '',
      periodId: grade?.periodId ?? (periodId === '__none__' ? '' : periodId),
      value: grade ? String(grade.value) : '',
      kind: grade?.kind ?? '',
      weight: String(grade?.weight ?? 1),
    });
    setDialog({ grade });
  };
  const save = async () => {
    if (saving || !ready || !canWrite || !dialog) return;
    const value = Number(form.value.replace(',', '.'));
    const weight = form.weight.trim() === '' ? 1 : Number(form.weight.replace(',', '.'));
    const min = Number(setting?.minGrade ?? 0);
    const max = Number(setting?.maxGrade ?? 10);
    const step = Number(setting?.step ?? 0.1);
    if (
      !form.value.trim() ||
      !Number.isFinite(value) ||
      value < min ||
      value > max ||
      step <= 0 ||
      Math.abs((value - min) / step - Math.round((value - min) / step)) > 1e-8
    ) {
      toast.error(`Informe uma nota entre ${min} e ${max}, em passos de ${step}.`);
      return;
    }
    if (!Number.isFinite(weight) || weight < 0 || weight > 999999) {
      toast.error('Informe um peso entre zero e 999999.');
      return;
    }
    if (!subjects.some((subject) => subject.id === form.subjectId)) {
      toast.error('Selecione uma matéria do curso.');
      return;
    }
    if (form.periodId && !periods.some((period) => period.id === form.periodId)) {
      toast.error('Selecione um período do curso.');
      return;
    }
    const requestScope = scope;
    setSaving(true);
    try {
      if (dialog.grade)
        await GradeService.update(studentId, dialog.grade.id, {
          value,
          weight,
          periodId: form.periodId || null,
          kind: form.kind.trim() || null,
        });
      else
        await GradeService.create(studentId, {
          subjectId: form.subjectId,
          value,
          weight,
          periodId: form.periodId || undefined,
          kind: form.kind.trim() || undefined,
        });
      if (currentScope.current === requestScope) {
        setDialog(null);
        reload();
        toast.success('Nota salva.');
      }
    } catch {
      toast.error('Não foi possível salvar a nota. Os campos foram preservados.');
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!target || saving || !canWrite || !ready) return;
    setSaving(true);
    try {
      await GradeService.delete(studentId, target.id);
      setTarget(null);
      reload();
      toast.success('Nota excluída.');
    } catch {
      toast.error('Não foi possível excluir a nota.');
    } finally {
      setSaving(false);
    }
  };
  const download = async () => {
    if (!ready || downloading) return;
    setDownloading(true);
    try {
      await downloadAuthenticatedPdf(`/students/${studentId}/report`, `boletim-${studentId}.pdf`, {
        courseId,
      });
    } catch {
      toast.error('Não foi possível baixar o boletim. Confira o acesso e tente novamente.');
    } finally {
      setDownloading(false);
    }
  };

  if (!courses.length)
    return (
      <Alert severity="info">
        Aluno sem matrícula em um curso. O boletim depende do vínculo com o curso.
      </Alert>
    );
  return (
    <Stack spacing={3}>
      <Card sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            select
            label="Curso das notas"
            value={courseId}
            disabled={saving || downloading}
            onChange={(event) => changeCourse(event.target.value)}
            sx={{ minWidth: 220 }}
          >
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Visualização"
            value={view}
            onChange={(event) => { const value = event.target.value as 'details' | 'overview'; setView(value); onViewChange?.(value); }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="details">Avaliações por período</MenuItem>
            <MenuItem value="overview">Boletim — visão geral</MenuItem>
          </TextField>
          {view === 'details' && (
            <TextField
              select
              label="Período das notas"
              value={periodId}
              disabled={!ready}
              onChange={(event) => setPeriodId(event.target.value)}
              sx={{ minWidth: 190 }}
            >
              <MenuItem value="">Todos os períodos</MenuItem>
              <MenuItem value="__none__">Sem período</MenuItem>
              {periods.map((period) => (
                <MenuItem key={period.id} value={period.id}>
                  {period.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <Box sx={{ flex: 1 }} />
          <LoadingButton
            variant="outlined"
            loading={downloading}
            disabled={!ready}
            onClick={download}
          >
            Baixar boletim (PDF)
          </LoadingButton>
          {canWrite && (
            <Button
              variant="contained"
              disabled={!ready || !subjects.length}
              onClick={() => open()}
            >
              Lançar nota
            </Button>
          )}
        </Stack>
      </Card>
      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={reload}>
              Tentar novamente
            </Button>
          }
        >
          Não foi possível carregar as notas. Médias e boletim estão indisponíveis; isso não
          significa que o aluno esteja sem notas.
        </Alert>
      )}
      {!ready && !error ? (
        <Stack alignItems="center" sx={{ p: 5 }}>
          <CircularProgress aria-label="Carregando notas" />
        </Stack>
      ) : (
        ready && (
          <>
            {!subjects.length && (
              <Alert severity="info">Nenhuma matéria vinculada a este curso.</Alert>
            )}
            {grades.some(
              (grade) => grade.periodId && !periods.some((period) => period.id === grade.periodId)
            ) && (
              <Alert severity="warning">
                Há avaliações com período não encontrado. Confira os lançamentos antes de usar as
                médias.
              </Alert>
            )}
            {view === 'overview' ? (
              <Card sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Boletim — {courses.find((course) => course.id === courseId)?.name}
                </Typography>
                <TableContainer>
                  <Table size="small" aria-label="Boletim por matéria e período">
                    <TableHead>
                      <TableRow>
                        <TableCell>Matéria</TableCell>
                        {overview.columns.map((period) => (
                          <TableCell key={period.id} align="center">
                            {period.shortName || period.name}
                          </TableCell>
                        ))}
                        <TableCell align="center">Média da matéria</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overview.rows.map((row) => (
                        <TableRow key={row.subject.id}>
                          <TableCell>{row.subject.name}</TableCell>
                          {row.cells.map((cell) => (
                            <TableCell key={cell.period.id} align="center">
                              {format(cell.average)}
                              {cell.count > 1 && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  {cell.count} avaliações
                                </Typography>
                              )}
                            </TableCell>
                          ))}
                          <TableCell align="center">{format(row.average)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: 'background.neutral' }}>
                        <TableCell>Média do período</TableCell>
                        {overview.periodAverages.map((value, index) => (
                          <TableCell key={overview.columns[index].id} align="center">
                            {format(value)}
                          </TableCell>
                        ))}
                        <TableCell align="center">{format(overview.finalAverage)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 2 }}>
                  Sem avaliações: —. Zero é uma nota válida. Cálculo compatível com o boletim atual:
                  médias na escala 0–10; quando há pesos diferentes de 1, os pontos são limitados ao
                  peso e normalizados para 10. As médias das matérias consideram os pesos dos
                  períodos. O PDF sempre contém todos os períodos do curso.
                </Typography>
              </Card>
            ) : (
              <Card>
                <TableContainer>
                  <Table size="small" aria-label="Avaliações do aluno">
                    <TableHead>
                      <TableRow>
                        {['Matéria', 'Tipo', 'Período', 'Nota', 'Peso', 'Ações'].map((label) => (
                          <TableCell key={label}>{label}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!displayed.length && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            Nenhuma avaliação neste filtro.
                          </TableCell>
                        </TableRow>
                      )}
                      {displayed.map((grade) => (
                        <TableRow key={grade.id}>
                          <TableCell>
                            {subjects.find((subject) => subject.id === grade.subjectId)?.name ??
                              grade.subject?.name}
                          </TableCell>
                          <TableCell>{grade.kind || 'Avaliação'}</TableCell>
                          <TableCell>
                            {periods.find((period) => period.id === grade.periodId)?.name ??
                              (grade.periodId ? 'Período não encontrado' : 'Sem período')}
                          </TableCell>
                          <TableCell>{format(Number(grade.value))}</TableCell>
                          <TableCell>{grade.weight ?? 1}</TableCell>
                          <TableCell>
                            {canWrite && (
                              <Stack direction="row">
                                <Button size="small" onClick={() => open(grade)}>
                                  Editar nota
                                </Button>
                                <Button size="small" color="error" onClick={() => setTarget(grade)}>
                                  Excluir nota
                                </Button>
                              </Stack>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}
          </>
        )
      )}
      <Dialog
        open={!!dialog}
        onClose={() => {
          if (!saving) setDialog(null);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{dialog?.grade ? 'Editar nota' : 'Lançar nota'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label="Matéria"
              value={form.subjectId}
              disabled={!!dialog?.grade || saving}
              onChange={(event) => setForm({ ...form, subjectId: event.target.value })}
            >
              {subjects.map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Período da avaliação"
              value={form.periodId}
              disabled={saving}
              onChange={(event) => setForm({ ...form, periodId: event.target.value })}
            >
              <MenuItem value="">Sem período</MenuItem>
              {periods.map((period) => (
                <MenuItem key={period.id} value={period.id}>
                  {period.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Nota"
              value={form.value}
              disabled={saving}
              onChange={(event) => setForm({ ...form, value: event.target.value })}
              inputProps={{ inputMode: 'decimal' }}
              helperText={`De ${setting?.minGrade ?? 0} a ${setting?.maxGrade ?? 10}, passo ${setting?.step ?? 0.1}.`}
            />
            <TextField
              label="Tipo de avaliação"
              value={form.kind}
              disabled={saving}
              inputProps={{ maxLength: 80 }}
              onChange={(event) => setForm({ ...form, kind: event.target.value })}
            />
            <TextField
              label="Peso da avaliação"
              value={form.weight}
              disabled={saving}
              onChange={(event) => setForm({ ...form, weight: event.target.value })}
              inputProps={{ inputMode: 'decimal' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setDialog(null)}>
            Cancelar
          </Button>
          <LoadingButton loading={saving} variant="contained" onClick={save}>
            Salvar nota
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={!!target}
        onClose={() => {
          if (!saving) setTarget(null);
        }}
        title="Excluir avaliação"
        content="Esta nota será removida e as médias serão recalculadas. Deseja continuar?"
        action={
          <LoadingButton color="error" variant="contained" loading={saving} onClick={remove}>
            Confirmar exclusão
          </LoadingButton>
        }
      />
    </Stack>
  );
}

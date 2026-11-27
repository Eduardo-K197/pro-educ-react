'use client';

import type { MyAttempt, MyQuestion } from 'src/services/learning-student';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { StudentLearningApi } from 'src/services/learning-student';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const AUTOSAVE_MS = 1500;

function isBlank(v: unknown) {
  return v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length);
}

function Countdown({ deadline, offset, onExpire }: { deadline: string; offset: number; onExpire: () => void }) {
  const [left, setLeft] = useState(() => new Date(deadline).getTime() - (Date.now() + offset));
  const fired = useRef(false);
  useEffect(() => {
    const t = window.setInterval(() => {
      const ms = new Date(deadline).getTime() - (Date.now() + offset);
      setLeft(ms);
      if (ms <= 0 && !fired.current) {
        fired.current = true;
        onExpire();
      }
    }, 1000);
    return () => window.clearInterval(t);
  }, [deadline, offset, onExpire]);
  const sec = Math.max(0, Math.floor(left / 1000));
  const label = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  return (
    <Box
      sx={{
        position: 'sticky',
        top: 64,
        zIndex: 2,
        alignSelf: 'flex-end',
        px: 1.5,
        py: 0.5,
        borderRadius: 1,
        bgcolor: sec < 120 ? 'error.main' : 'grey.800',
        color: 'common.white',
        typography: 'subtitle2',
      }}
    >
      <Iconify icon="solar:clock-circle-bold" width={16} sx={{ mr: 0.5, verticalAlign: 'middle' }} />
      {label}
    </Box>
  );
}

function QuestionInputBlock({ q, value, onChange, disabled }: { q: MyQuestion; value: unknown; onChange: (v: unknown) => void; disabled?: boolean }) {
  if (q.type === 'single') {
    return (
      <Stack>
        {q.options?.map((o) => (
          <FormControlLabel
            key={o.id}
            control={<Radio checked={value === o.id} onChange={() => onChange(o.id)} disabled={disabled} />}
            label={o.text}
            sx={{ py: 0.5, alignItems: 'flex-start', '& .MuiFormControlLabel-label': { pt: 1 } }}
          />
        ))}
      </Stack>
    );
  }
  if (q.type === 'multiple') {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    return (
      <Stack>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Marque todas as corretas.
        </Typography>
        {q.options?.map((o) => (
          <FormControlLabel
            key={o.id}
            control={
              <Checkbox
                checked={arr.includes(o.id)}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked ? [...arr, o.id] : arr.filter((x) => x !== o.id))}
              />
            }
            label={o.text}
            sx={{ py: 0.5, alignItems: 'flex-start', '& .MuiFormControlLabel-label': { pt: 1 } }}
          />
        ))}
      </Stack>
    );
  }
  if (q.type === 'true_false') {
    return (
      <Stack direction="row" spacing={1.5}>
        {[true, false].map((v) => (
          <Button key={String(v)} fullWidth size="large" disabled={disabled} variant={value === v ? 'contained' : 'outlined'} onClick={() => onChange(v)}>
            {v ? 'Verdadeiro' : 'Falso'}
          </Button>
        ))}
      </Stack>
    );
  }
  return (
    <TextField
      fullWidth
      multiline={q.type === 'essay'}
      minRows={q.type === 'essay' ? 5 : 1}
      placeholder={q.type === 'essay' ? 'Escreva sua resposta...' : 'Sua resposta'}
      value={typeof value === 'string' ? value : ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      inputProps={{ maxLength: q.type === 'essay' ? 20000 : 500 }}
    />
  );
}

function ResultAnswer({ q }: { q: MyQuestion }) {
  const fmt = (v: unknown) => {
    if (isBlank(v)) return 'Em branco';
    if (q.type === 'true_false') return v ? 'Verdadeiro' : 'Falso';
    if (q.type === 'single' || q.type === 'multiple') {
      const ids = Array.isArray(v) ? (v as string[]) : [v as string];
      return ids.map((id) => q.options?.find((o) => o.id === id)?.text ?? '?').join('; ');
    }
    if (q.type === 'short' && Array.isArray(v)) return (v as string[]).join(' / ');
    return String(v);
  };
  return (
    <Stack spacing={1} sx={{ mt: 1 }}>
      <Typography variant="body2">
        <strong>Sua resposta:</strong> {fmt(q.response)}
      </Typography>
      {q.answerKey !== undefined && q.answerKey !== null && q.type !== 'essay' && (
        <Typography variant="body2" sx={{ color: 'success.main' }}>
          <strong>Gabarito:</strong> {fmt(q.answerKey)}
        </Typography>
      )}
      {q.explanation && <Box sx={{ typography: 'body2', color: 'text.secondary' }} dangerouslySetInnerHTML={{ __html: q.explanation }} />}
      <Typography variant="caption" sx={{ color: q.pending ? 'warning.main' : q.isCorrect ? 'success.main' : 'text.secondary' }}>
        {q.pending ? 'Aguardando correção' : `${q.earned ?? 0} de ${q.points} pontos`}
      </Typography>
    </Stack>
  );
}

/** Prova no celular: uma questão por cartão, salvamento automático e cronômetro. */
export function StudentAttemptView({ id }: { id: string }) {
  const [attempt, setAttempt] = useState<MyAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dirty = useRef<Set<string>>(new Set());
  const offset = useRef(0);

  const apply = useCallback((a: MyAttempt) => {
    offset.current = new Date(a.serverNow).getTime() - Date.now();
    setAttempt(a);
    setAnswers(Object.fromEntries(a.questions.map((q) => [q.id, q.response ?? null])));
  }, []);

  useEffect(() => {
    StudentLearningApi.attempt(id)
      .then(apply)
      .catch((err) => setError(err?.response?.status === 404 ? 'Prova não encontrada.' : err?.message || 'Erro ao carregar.'));
  }, [id, apply]);

  const flush = useCallback(async () => {
    if (!dirty.current.size) return;
    const ids = Array.from(dirty.current);
    dirty.current.clear();
    setSaving('saving');
    try {
      await StudentLearningApi.saveAnswers(id, ids.map((questionId) => ({ questionId, response: answers[questionId] ?? null })));
      setSaving('saved');
    } catch (err: any) {
      if (err?.response?.status === 410) {
        toast.info('O tempo acabou. Suas respostas salvas foram enviadas.');
        StudentLearningApi.attempt(id).then(apply);
        return;
      }
      ids.forEach((x) => dirty.current.add(x));
      setSaving('error');
    }
  }, [answers, id, apply]);

  useEffect(() => {
    if (!dirty.current.size) return undefined;
    const t = window.setTimeout(flush, AUTOSAVE_MS);
    return () => window.clearTimeout(t);
  }, [answers, flush]);

  const change = (questionId: string, value: unknown) => {
    dirty.current.add(questionId);
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([questionId, response]) => ({ questionId, response }));
      dirty.current.clear();
      apply(await StudentLearningApi.submitAttempt(id, payload));
      setConfirm(false);
      toast.success('Prova enviada!');
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível enviar');
    } finally {
      setSubmitting(false);
    }
  };

  const onExpire = useCallback(() => {
    // O servidor fecha a tentativa no prazo; recarrega para mostrar o resultado.
    window.setTimeout(() => StudentLearningApi.attempt(id).then(apply).catch(() => {}), 1500);
  }, [id, apply]);

  if (error) return <Alert severity="warning">{error}</Alert>;
  if (!attempt) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const back = (
    <Button component={RouterLink} href={paths.student.course(attempt.assessment.courseId)} size="small" startIcon={<Iconify icon="eva:arrow-ios-back-fill" />} sx={{ ml: -1 }}>
      Voltar ao curso
    </Button>
  );

  if (attempt.status !== 'in_progress') {
    return (
      <Stack spacing={2}>
        {back}
        <Typography variant="h5">{attempt.assessment.title}</Typography>
        {attempt.resultsReleased ? (
          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Sua nota
            </Typography>
            <Typography variant="h3">{attempt.grade ?? '—'}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {attempt.score} de {attempt.maxScore} pontos nesta tentativa
            </Typography>
          </Card>
        ) : (
          <Alert severity="success">Prova enviada! A nota e o gabarito aparecem aqui quando o professor liberar.</Alert>
        )}
        {!!attempt.feedback?.length && (
          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Feedback do professor
            </Typography>
            {attempt.feedback.map((f) => (
              <Box key={f.id} sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {f.authorName ?? 'Professor'}
                </Typography>
                <Box sx={{ typography: 'body2' }} dangerouslySetInnerHTML={{ __html: f.body }} />
              </Box>
            ))}
          </Card>
        )}
        {attempt.resultsReleased &&
          attempt.questions.map((q, i) => (
            <Card key={q.id} sx={{ p: 2.5, borderLeft: 4, borderColor: q.pending ? 'warning.main' : q.isCorrect ? 'success.main' : 'error.light' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Questão {i + 1}
              </Typography>
              <Box sx={{ typography: 'body1', '& p': { my: 0.5 } }} dangerouslySetInnerHTML={{ __html: q.prompt }} />
              <ResultAnswer q={q} />
            </Card>
          ))}
      </Stack>
    );
  }

  const unanswered = attempt.questions.filter((q) => isBlank(answers[q.id])).length;

  return (
    <Stack spacing={2}>
      {back}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">{attempt.assessment.title}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Tentativa {attempt.number} de {attempt.maxAttempts} ·{' '}
            {saving === 'saving' ? 'salvando...' : saving === 'saved' ? 'respostas salvas' : saving === 'error' ? 'sem conexão, tentando de novo' : 'salvamento automático'}
          </Typography>
        </Box>
      </Stack>
      {attempt.deadlineAt && <Countdown deadline={attempt.deadlineAt} offset={offset.current} onExpire={onExpire} />}
      {attempt.assessment.description && (
        <Box sx={{ typography: 'body2', color: 'text.secondary' }} dangerouslySetInnerHTML={{ __html: attempt.assessment.description }} />
      )}

      {attempt.questions.map((q, i) => (
        <Card key={q.id} sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Questão {i + 1} de {attempt.questions.length} · {q.points} pt
          </Typography>
          <Box sx={{ typography: 'body1', mb: 1.5, '& p': { my: 0.5 }, '& img': { maxWidth: 1 } }} dangerouslySetInnerHTML={{ __html: q.prompt }} />
          <QuestionInputBlock q={q} value={answers[q.id]} onChange={(v) => change(q.id, v)} />
        </Card>
      ))}

      <LoadingButton variant="contained" size="large" loading={submitting} onClick={() => setConfirm(true)}>
        Enviar prova
      </LoadingButton>

      <Dialog open={confirm} onClose={() => setConfirm(false)}>
        <DialogTitle>Enviar a prova?</DialogTitle>
        <DialogContent>
          {unanswered ? `Você deixou ${unanswered} questão(ões) em branco. ` : ''}Depois de enviar não dá para alterar as respostas.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(false)}>Revisar</Button>
          <LoadingButton variant="contained" loading={submitting} onClick={submit}>
            Enviar
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

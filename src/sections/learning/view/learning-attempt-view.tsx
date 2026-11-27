'use client';

import type { AttemptDetail } from 'src/services/learning';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { LearningAssessmentApi } from 'src/services/learning';

import { Label } from 'src/components/label';
import { Editor } from 'src/components/editor';
import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { QUESTION_TYPE_LABEL } from '../learning-question-dialog';

// ----------------------------------------------------------------------

function renderResponse(q: AttemptDetail['questions'][number]) {
  const r = q.answer?.response;
  if (r === null || r === undefined || r === '' || (Array.isArray(r) && !r.length)) return <em>Em branco</em>;
  if (q.type === 'true_false') return r ? 'Verdadeiro' : 'Falso';
  if (q.type === 'single' || q.type === 'multiple') {
    const ids = Array.isArray(r) ? (r as string[]) : [r as string];
    return ids.map((id) => q.options?.find((o) => o.id === id)?.text ?? '?').join('; ');
  }
  return <Box component="span" sx={{ whiteSpace: 'pre-wrap' }}>{String(r)}</Box>;
}

/** Correção de uma tentativa: notas manuais (dissertativas ou ajuste) e feedback ao aluno. */
export function LearningAttemptView({ id }: { id: string }) {
  const [data, setData] = useState<AttemptDetail | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [visible, setVisible] = useState(true);
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const load = useCallback(() => {
    LearningAssessmentApi.attempt(id)
      .then((d) => {
        setData(d);
        setScores(Object.fromEntries(d.questions.map((q) => [q.id, q.answer?.manualScore !== null && q.answer?.manualScore !== undefined ? String(q.answer.manualScore) : ''])));
      })
      .catch((err) => toast.error(err?.message || 'Erro ao carregar a tentativa'));
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

  const { attempt, assessment, questions } = data;

  const saveScores = async () => {
    const changed = questions
      .filter((q) => scores[q.id] !== '' && Number(scores[q.id]) !== q.answer?.manualScore)
      .map((q) => ({ questionId: q.id, manualScore: Number(scores[q.id].replace(',', '.')) }));
    if (!changed.length) {
      toast.info('Nada para salvar');
      return;
    }
    setSaving(true);
    try {
      const res = await LearningAssessmentApi.grade(attempt.id, changed);
      toast.success(res.pending ? `Notas salvas. Faltam ${res.pending} questão(ões).` : 'Correção concluída e nota lançada no boletim');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível salvar');
    } finally {
      setSaving(false);
    }
  };

  const sendFeedback = async () => {
    setSendingFeedback(true);
    try {
      await LearningAssessmentApi.createFeedback({ attemptId: attempt.id, body: feedback, visibleToStudent: visible });
      setFeedback('');
      toast.success('Feedback registrado');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível enviar');
    } finally {
      setSendingFeedback(false);
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`${attempt.studentName ?? 'Aluno'} — tentativa ${attempt.number}`}
        links={[
          { name: 'Correção', href: paths.dashboard.learning.grading },
          { name: assessment.title, href: paths.dashboard.learning.assessment(assessment.id) },
          { name: attempt.studentName ?? 'Tentativa' },
        ]}
        sx={{ mb: 3 }}
      />

      <Card sx={{ p: 2.5, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Label color={attempt.status === 'graded' ? 'success' : 'warning'}>{attempt.status === 'graded' ? 'Corrigida' : 'A corrigir'}</Label>
          <Typography variant="body2">
            Pontos: <strong>{attempt.score ?? '—'}</strong> / {attempt.maxScore ?? '—'}
          </Typography>
          {attempt.submittedAt && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Enviada em {fDateTime(attempt.submittedAt, 'DD/MM/YYYY HH:mm')}
            </Typography>
          )}
        </Stack>
      </Card>

      <Stack spacing={2}>
        {questions.map((q, i) => {
          const a = q.answer;
          return (
            <Card key={q.id} sx={{ p: 2.5, borderLeft: 4, borderColor: q.pending ? 'warning.main' : a?.isCorrect ? 'success.main' : 'divider' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {i + 1}. {QUESTION_TYPE_LABEL[q.type]} · vale {q.points}
              </Typography>
              <Box sx={{ typography: 'body2', '& p': { my: 0.5 } }} dangerouslySetInnerHTML={{ __html: q.prompt }} />
              <Box sx={{ mt: 1, p: 1.5, borderRadius: 1, bgcolor: 'background.neutral', typography: 'body2' }}>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  Resposta do aluno
                </Typography>
                {renderResponse(q)}
              </Box>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1.5 }} flexWrap="wrap">
                {a?.autoScore !== null && a?.autoScore !== undefined && (
                  <Typography variant="body2" sx={{ color: a.isCorrect ? 'success.main' : 'error.main' }}>
                    Correção automática: {a.autoScore}
                  </Typography>
                )}
                {a?.aiSuggestedScore !== null && a?.aiSuggestedScore !== undefined && (
                  <Typography variant="body2" sx={{ color: 'info.main' }}>
                    Sugestão da IA: {a.aiSuggestedScore}
                  </Typography>
                )}
                <TextField
                  size="small"
                  label={q.pending ? 'Nota (pendente)' : 'Nota manual'}
                  value={scores[q.id] ?? ''}
                  onChange={(e) => setScores((s) => ({ ...s, [q.id]: e.target.value }))}
                  sx={{ width: 150 }}
                  helperText={`0 a ${q.points}`}
                  error={q.pending}
                />
              </Stack>
            </Card>
          );
        })}
      </Stack>

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <LoadingButton variant="contained" loading={saving} onClick={saveScores}>
          Salvar correção
        </LoadingButton>
      </Stack>

      <Card sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Feedback ao aluno
        </Typography>
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {data.feedback.map((f) => (
            <Box key={f.id} sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {f.authorName ?? 'Professor'} · {f.createdAt ? fDateTime(f.createdAt, 'DD/MM/YYYY HH:mm') : ''}
                {f.visibleToStudent ? '' : ' · interno'}
              </Typography>
              <Box sx={{ typography: 'body2' }} dangerouslySetInnerHTML={{ __html: f.body }} />
              {f.aiDraft && <Alert severity="info" sx={{ mt: 1 }}>Rascunho sugerido pela IA: {f.aiDraft}</Alert>}
            </Box>
          ))}
        </Stack>
        <Editor value={feedback} onChange={setFeedback} placeholder="Escreva um retorno para o aluno..." sx={{ maxHeight: 260 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
          <FormControlLabel control={<Switch checked={visible} onChange={(e) => setVisible(e.target.checked)} />} label="Visível para o aluno" />
          <Button variant="outlined" disabled={sendingFeedback || !feedback.replace(/<[^>]*>/g, '').trim()} onClick={sendFeedback}>
            Enviar feedback
          </Button>
        </Stack>
      </Card>
    </DashboardContent>
  );
}

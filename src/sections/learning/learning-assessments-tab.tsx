'use client';

import type { AssessmentSummary } from 'src/services/learning';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CardActionArea from '@mui/material/CardActionArea';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import { LearningAssessmentApi } from 'src/services/learning';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

/** Aba "Avaliações" do curso no painel. */
export function LearningAssessmentsTab({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<AssessmentSummary[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    LearningAssessmentApi.list(courseId)
      .then((res) => {
        setItems(res.assessments);
        setCanEdit(res.canEdit);
      })
      .catch((err) => toast.error(err?.message || 'Erro ao carregar as avaliações'));
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setSaving(true);
    try {
      const a = await LearningAssessmentApi.create(courseId, { title: title.trim() });
      router.push(paths.dashboard.learning.assessment(a.id));
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível criar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button component={RouterLink} href={paths.dashboard.learning.grading} startIcon={<Iconify icon="solar:checklist-minimalistic-bold" />}>
          Fila de correção
        </Button>
        {canEdit && (
          <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={() => setCreating(true)}>
            Nova avaliação
          </Button>
        )}
      </Stack>

      {!items.length && <EmptyContent filled title="Nenhuma avaliação neste curso" sx={{ py: 8 }} />}

      {items.map((a) => (
        <Card key={a.id}>
          <CardActionArea component={RouterLink} href={paths.dashboard.learning.assessment(a.id)} sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="subtitle1" sx={{ flex: 1 }}>
                {a.title}
              </Typography>
              <Label color={a.published ? 'success' : 'default'}>{a.published ? 'Publicada' : 'Rascunho'}</Label>
              {a.resultsReleasedAt && <Label color="info">Resultados liberados</Label>}
              {a.pendingCount > 0 && <Label color="warning">{a.pendingCount} para corrigir</Label>}
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {a.kind} · peso {a.weight} · {a.questionCount} questões ({a.totalPoints} pts) · {a.attemptCount} envios
              {a.dueAt ? ` · prazo ${fDateTime(a.dueAt, 'DD/MM/YYYY HH:mm')}` : ''}
            </Typography>
          </CardActionArea>
        </Card>
      ))}

      <Dialog open={creating} onClose={() => setCreating(false)} fullWidth maxWidth="xs">
        <DialogTitle>Nova avaliação</DialogTitle>
        <DialogContent>
          <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth autoFocus sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreating(false)}>Cancelar</Button>
          <LoadingButton variant="contained" loading={saving} disabled={!title.trim()} onClick={create}>
            Criar
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

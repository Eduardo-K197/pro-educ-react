'use client';

import type { CrmTag } from 'src/types/services/crm';
import type { CrmDeal, CrmPipeline, CrmDealPayload } from 'src/types/services/crm-deal';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { CrmService } from 'src/services/crm';
import { GrowthService } from 'src/services/growth';

import { toast } from 'src/components/snackbar';

import { CRM_DEAL_SOURCES } from 'src/types/services/crm-deal';

import { useGrowthOwners, useGrowthCourses } from './deal-utils';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (deal: CrmDeal) => void;
  deal?: CrmDeal | null;
  pipeline?: CrmPipeline | null;
  /** Etapa inicial (criar a partir de uma coluna do kanban). */
  stageId?: string | null;
  canSupervise: boolean;
};

type FormState = {
  title: string;
  studentName: string;
  studentBirthDate: string;
  interestCourseId: string;
  interestLabel: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  source: string;
  estimatedValue: string;
  expectedCloseAt: string;
  description: string;
  owner: string;
  tagIds: string[];
};

const ownerKey = (type?: string | null, id?: string | null) => (type && id ? `${type}:${id}` : '');

function initial(deal?: CrmDeal | null): FormState {
  return {
    title: deal?.title ?? '',
    studentName: deal?.studentName ?? '',
    studentBirthDate: deal?.studentBirthDate?.slice(0, 10) ?? '',
    interestCourseId: deal?.interestCourseId ?? '',
    interestLabel: deal?.interestLabel ?? '',
    guardianName: deal?.guardianName ?? '',
    guardianPhone: deal?.guardianPhone ?? '',
    guardianEmail: deal?.guardianEmail ?? '',
    source: deal?.source ?? '',
    estimatedValue: deal?.estimatedValue != null ? String(deal.estimatedValue) : '',
    expectedCloseAt: deal?.expectedCloseAt?.slice(0, 10) ?? '',
    description: deal?.description ?? '',
    owner: ownerKey(deal?.owner?.type, deal?.owner?.id),
    tagIds: deal?.tags.map((t) => t.id) ?? [],
  };
}

export function CrmDealFormDialog({ open, onClose, onSaved, deal, pipeline, stageId, canSupervise }: Props) {
  const [form, setForm] = useState<FormState>(() => initial(deal));
  const [tags, setTags] = useState<CrmTag[]>([]);
  const [saving, setSaving] = useState(false);
  const owners = useGrowthOwners(open && canSupervise);
  const courses = useGrowthCourses(open);

  useEffect(() => {
    if (!open) return;
    setForm(initial(deal));
    CrmService.listTags()
      .then(setTags)
      .catch(() => setTags([]));
  }, [open, deal]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    const value = form.estimatedValue.trim() ? Number(form.estimatedValue.replace(',', '.')) : null;
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      toast.error('Valor estimado inválido.');
      return;
    }
    const payload: CrmDealPayload = {
      title: form.title.trim() || null,
      studentName: form.studentName.trim() || null,
      studentBirthDate: form.studentBirthDate || null,
      interestCourseId: form.interestCourseId || null,
      interestLabel: form.interestLabel.trim() || null,
      guardianName: form.guardianName.trim() || null,
      guardianPhone: form.guardianPhone.trim() || null,
      guardianEmail: form.guardianEmail.trim() || null,
      source: form.source || null,
      estimatedValue: value,
      expectedCloseAt: form.expectedCloseAt || null,
      description: form.description.trim() || null,
      tagIds: form.tagIds,
    };
    if (canSupervise) {
      const [userType, userId] = form.owner ? form.owner.split(':') : [];
      const current = ownerKey(deal?.owner?.type, deal?.owner?.id);
      if (!deal || form.owner !== current) payload.owner = userType && userId ? { userType, userId } : deal ? null : undefined;
    }
    setSaving(true);
    try {
      const saved = deal
        ? await GrowthService.updateDeal(deal.id, payload)
        : await GrowthService.createDeal({ ...payload, pipelineId: pipeline?.id ?? null, stageId: stageId ?? null });
      toast.success(deal ? 'Lead atualizado.' : 'Lead criado.');
      onSaved(saved);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível salvar o lead.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{deal ? 'Editar lead' : 'Novo lead'}</DialogTitle>
      <DialogContent>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2} sx={{ pt: 1 }}>
          <TextField label="Título" value={form.title} onChange={set('title')} helperText="Vazio = nome do aluno ou do responsável" inputProps={{ maxLength: 150 }} />
          <TextField select label="Origem" value={form.source} onChange={set('source')}>
            <MenuItem value="">Não informada</MenuItem>
            {CRM_DEAL_SOURCES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>

          <Typography variant="subtitle2" sx={{ gridColumn: '1 / -1', mt: 1 }}>
            Aluno interessado
          </Typography>
          <TextField label="Nome do aluno" value={form.studentName} onChange={set('studentName')} inputProps={{ maxLength: 120 }} />
          <TextField label="Data de nascimento" type="date" value={form.studentBirthDate} onChange={set('studentBirthDate')} InputLabelProps={{ shrink: true }} />
          <TextField select label="Curso de interesse" value={form.interestCourseId} onChange={set('interestCourseId')}>
            <MenuItem value="">Não definido</MenuItem>
            {courses.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
            {form.interestCourseId && !courses.some((c) => c.id === form.interestCourseId) && (
              <MenuItem value={form.interestCourseId}>{deal?.interestLabel ?? 'Curso atual'}</MenuItem>
            )}
          </TextField>
          <TextField
            label="Série / turno de interesse"
            value={form.interestLabel}
            onChange={set('interestLabel')}
            helperText="Vazio = nome do curso"
            inputProps={{ maxLength: 120 }}
          />

          <Typography variant="subtitle2" sx={{ gridColumn: '1 / -1', mt: 1 }}>
            Responsável
          </Typography>
          <TextField label="Nome do responsável" value={form.guardianName} onChange={set('guardianName')} inputProps={{ maxLength: 120 }} />
          <TextField label="Telefone" value={form.guardianPhone} onChange={set('guardianPhone')} inputProps={{ maxLength: 30 }} />
          <TextField label="E-mail" value={form.guardianEmail} onChange={set('guardianEmail')} inputProps={{ maxLength: 120 }} />

          <Typography variant="subtitle2" sx={{ gridColumn: '1 / -1', mt: 1 }}>
            Negociação
          </Typography>
          <TextField label="Valor estimado (R$)" value={form.estimatedValue} onChange={set('estimatedValue')} inputMode="decimal" />
          <TextField label="Previsão de fechamento" type="date" value={form.expectedCloseAt} onChange={set('expectedCloseAt')} InputLabelProps={{ shrink: true }} />
          {canSupervise && (
            <TextField select label="Responsável comercial" value={form.owner} onChange={set('owner')}>
              <MenuItem value="">{deal ? 'Sem responsável' : 'Eu mesmo'}</MenuItem>
              {owners.map((a) => (
                <MenuItem key={`${a.userType}:${a.userId}`} value={`${a.userType}:${a.userId}`}>
                  {a.name}
                </MenuItem>
              ))}
              {form.owner && !owners.some((a) => `${a.userType}:${a.userId}` === form.owner) && (
                <MenuItem value={form.owner}>{deal?.owner?.name ?? 'Responsável atual'}</MenuItem>
              )}
            </TextField>
          )}
          <Autocomplete
            multiple
            options={tags}
            value={tags.filter((t) => form.tagIds.includes(t.id))}
            getOptionLabel={(t) => t.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            onChange={(_e, v) => setForm((f) => ({ ...f, tagIds: v.map((t) => t.id) }))}
            renderTags={(value, getTagProps) =>
              value.map((t, i) => <Chip {...getTagProps({ index: i })} key={t.id} size="small" label={t.name} sx={{ bgcolor: t.color, color: 'common.white' }} />)
            }
            renderInput={(params) => <TextField {...params} label="Tags" />}
          />
          <TextField
            label="Observações"
            value={form.description}
            onChange={set('description')}
            multiline
            minRows={3}
            inputProps={{ maxLength: 5000 }}
            sx={{ gridColumn: '1 / -1' }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancelar
        </Button>
        <LoadingButton variant="contained" loading={saving} onClick={submit}>
          Salvar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

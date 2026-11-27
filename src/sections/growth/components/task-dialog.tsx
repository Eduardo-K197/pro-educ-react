'use client';

import type { CrmTask, CrmTaskPayload } from 'src/types/services/crm-deal';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { GrowthService } from 'src/services/growth';

import { toast } from 'src/components/snackbar';

import { useCrmAgents, toLocalInput } from './deal-utils';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (task: CrmTask) => void;
  dealId?: string | null;
  /** Tarefa de retenção (aluno em risco). */
  studentId?: number | null;
  defaultTitle?: string;
  task?: CrmTask | null;
  canSupervise: boolean;
};

function tomorrowAt9() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return toLocalInput(d.toISOString());
}

export function CrmTaskDialog({ open, onClose, onSaved, dealId, studentId, defaultTitle, task, canSupervise }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [assignee, setAssignee] = useState('');
  const [saving, setSaving] = useState(false);
  const agents = useCrmAgents(open && canSupervise);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? defaultTitle ?? '');
    setDescription(task?.description ?? '');
    setDueAt(task ? toLocalInput(task.dueAt) : tomorrowAt9());
    setAssignee(task ? `${task.assignee.type}:${task.assignee.id}` : '');
  }, [open, task, defaultTitle]);

  const submit = async () => {
    const payload: CrmTaskPayload = {
      title: title.trim(),
      description: description.trim() || null,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
    };
    if (canSupervise && assignee) {
      const [userType, userId] = assignee.split(':');
      payload.assignee = { userType, userId };
    }
    setSaving(true);
    try {
      const saved = task ? await GrowthService.updateTask(task.id, payload) : await GrowthService.createTask({ ...payload, dealId: dealId ?? null, studentId: studentId ?? null });
      toast.success(task ? 'Tarefa atualizada.' : 'Tarefa criada.');
      onSaved(saved);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível salvar a tarefa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{task ? 'Editar tarefa' : 'Nova tarefa / follow-up'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField autoFocus label="O que fazer *" value={title} onChange={(e) => setTitle(e.target.value)} inputProps={{ maxLength: 150 }} />
          <TextField label="Quando" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} InputLabelProps={{ shrink: true }} />
          {canSupervise && (
            <TextField select label="Responsável" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <MenuItem value="">Eu mesmo</MenuItem>
              {agents.map((a) => (
                <MenuItem key={`${a.userType}:${a.userId}`} value={`${a.userType}:${a.userId}`}>
                  {a.name}
                </MenuItem>
              ))}
              {assignee && !agents.some((a) => `${a.userType}:${a.userId}` === assignee) && (
                <MenuItem value={assignee}>{task?.assignee.name ?? 'Responsável atual'}</MenuItem>
              )}
            </TextField>
          )}
          <TextField label="Detalhes" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={3} inputProps={{ maxLength: 5000 }} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancelar
        </Button>
        <LoadingButton variant="contained" disabled={!title.trim()} loading={saving} onClick={submit}>
          Salvar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

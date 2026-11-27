'use client';

import type { CrmDepartment } from 'src/types/services/crm';
import type { CrmTicket, CrmTicketConfig, CrmTicketPriority } from 'src/types/services/crm-ticket';

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

import { CrmTicketService } from 'src/services/crm-ticket';

import { toast } from 'src/components/snackbar';

import { CRM_TICKET_PRIORITIES } from 'src/types/services/crm-ticket';

import { priorityLabel } from './utils';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  config: CrmTicketConfig | null;
  departments: CrmDepartment[];
  /** Vincula o chamado a uma conversa (opcional). */
  conversationId?: string | null;
  onCreated: (ticket: CrmTicket) => void;
};

type FormState = {
  subject: string;
  description: string;
  category: string;
  priority: CrmTicketPriority;
  departmentId: string;
};

const EMPTY: FormState = {
  subject: '',
  description: '',
  category: '',
  priority: 'media',
  departmentId: '',
};

export function CrmTicketFormDialog({
  open,
  onClose,
  config,
  departments,
  conversationId,
  onCreated,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ ...EMPTY, category: config?.categories[0]?.key ?? '' });
  }, [open, config]);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const changeCategory = (key: string) => {
    const category = config?.categories.find((c) => c.key === key);
    // Sugere o setor padrão da categoria (pode ser trocado).
    set({ category: key, departmentId: category?.departmentId ?? form.departmentId });
  };

  const priorities = config?.priorities.length
    ? config.priorities.map((p) => p.key)
    : CRM_TICKET_PRIORITIES;
  const valid = form.subject.trim().length > 0 && !!form.category;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const ticket = await CrmTicketService.create({
        subject: form.subject.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        priority: form.priority,
        departmentId: form.departmentId || undefined,
        conversationId: conversationId || undefined,
      });
      toast.success(`Chamado ${ticket.protocol} aberto`);
      onCreated(ticket);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao abrir o chamado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Novo chamado</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="Assunto"
            value={form.subject}
            onChange={(e) => set({ subject: e.target.value })}
            inputProps={{ maxLength: 200 }}
          />
          <TextField
            label="Descrição"
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            multiline
            minRows={3}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              fullWidth
              label="Categoria"
              value={form.category}
              onChange={(e) => changeCategory(e.target.value)}
              helperText={!config?.categories.length ? 'Nenhuma categoria configurada.' : ' '}
            >
              {(config?.categories ?? []).map((c) => (
                <MenuItem key={c.key} value={c.key}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              label="Prioridade"
              value={form.priority}
              onChange={(e) => set({ priority: e.target.value as CrmTicketPriority })}
              helperText=" "
            >
              {priorities.map((p) => (
                <MenuItem key={p} value={p}>
                  {priorityLabel(config, p)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField
            select
            label="Setor"
            value={form.departmentId}
            onChange={(e) => set({ departmentId: e.target.value })}
            SelectProps={{ displayEmpty: true }}
            InputLabelProps={{ shrink: true }}
            helperText="O prazo do SLA conta no horário de atendimento do setor."
          >
            <MenuItem value="">(sem setor)</MenuItem>
            {departments
              .filter((d) => d.active || d.id === form.departmentId)
              .map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <LoadingButton variant="contained" loading={saving} disabled={!valid} onClick={submit}>
          Abrir chamado
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

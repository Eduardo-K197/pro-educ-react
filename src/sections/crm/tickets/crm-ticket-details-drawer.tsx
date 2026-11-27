'use client';

import type { CrmAgent, CrmDepartment } from 'src/types/services/crm';
import type {
  CrmTicket,
  CrmTicketEvent,
  CrmTicketConfig,
  CrmTicketStatus,
  CrmTicketPriority,
  CrmTicketUpdatePayload,
} from 'src/types/services/crm-ticket';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import { CrmTicketService } from 'src/services/crm-ticket';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import {
  CRM_TICKET_STATUSES,
  CRM_TICKET_PRIORITIES,
  CRM_TICKET_STATUS_COLORS,
  CRM_TICKET_PRIORITY_COLORS,
} from 'src/types/services/crm-ticket';

import { CrmTicketCreatedBy } from './crm-ticket-created-by';
import {
  agentKey,
  slaColor,
  statusLabel,
  fSlaRemaining,
  categoryLabel,
  priorityLabel,
  assigneeOptions,
} from './utils';

// ----------------------------------------------------------------------

type Props = {
  ticketId: string | null;
  onClose: () => void;
  config: CrmTicketConfig | null;
  departments: CrmDepartment[];
  agents: CrmAgent[];
  /** Última versão recebida pelo socket (substitui a aberta se for do mesmo chamado). */
  live: CrmTicket | null;
  now: number;
  onUpdated: (ticket: CrmTicket) => void;
};

export function CrmTicketDetailsDrawer({
  ticketId,
  onClose,
  config,
  departments,
  agents,
  live,
  now,
  onUpdated,
}: Props) {
  const [ticket, setTicket] = useState<CrmTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  const load = useCallback(() => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    CrmTicketService.get(ticketId)
      .then(setTicket)
      .catch((err) => setError(err?.message || 'Erro ao carregar o chamado'))
      .finally(() => setLoading(false));
  }, [ticketId]);

  useEffect(() => {
    setTicket(null);
    setNote('');
    load();
  }, [load]);

  // Atualização em tempo real do chamado aberto.
  useEffect(() => {
    if (!live || live.id !== ticketId) return;
    setTicket((current) =>
      current ? { ...live, events: live.events ?? current.events } : current
    );
  }, [live, ticketId]);

  const patch = async (payload: CrmTicketUpdatePayload, success?: string) => {
    if (!ticket) return false;
    setSaving(true);
    try {
      const updated = await CrmTicketService.update(ticket.id, payload);
      setTicket((current) => ({ ...updated, events: updated.events ?? current?.events }));
      onUpdated(updated);
      if (success) toast.success(success);
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao atualizar o chamado');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    const text = note.trim();
    if (!text) return;
    if (await patch({ note: text }, 'Nota adicionada')) setNote('');
  };

  const options = assigneeOptions(agents, ticket);

  const lookup = (type: CrmTicketEvent['type'], value: string | null | undefined) => {
    if (value == null || value === '') return '(vazio)';
    switch (type) {
      case 'status':
        return statusLabel(config, value);
      case 'priority':
        return priorityLabel(config, value);
      case 'category':
        return categoryLabel(config, value);
      case 'department':
        return departments.find((d) => d.id === value)?.name ?? value;
      case 'assignee':
        return options.find((o) => o.key === value || o.id === value)?.name ?? value;
      default:
        return value;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={!!ticketId}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: 1, sm: 520 } } }}
    >
      <Stack direction="row" alignItems="center" sx={{ px: 2.5, py: 2 }}>
        <Typography variant="h6" sx={{ flex: 1 }} noWrap>
          {ticket ? ticket.protocol : 'Chamado'}
        </Typography>
        <IconButton onClick={load} disabled={loading || !ticketId}>
          <Iconify icon="solar:restart-bold" />
        </IconButton>
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Stack>
      <Divider />

      {loading && !ticket && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 8 }} />}

      {error && !ticket && (
        <Alert severity="error" sx={{ m: 2.5 }}>
          {error}
        </Alert>
      )}

      {ticket && (
        <Scrollbar sx={{ flex: 1 }}>
          <Stack spacing={3} sx={{ p: 2.5 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1">{ticket.subject}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                <Label variant="soft" color={CRM_TICKET_STATUS_COLORS[ticket.status] ?? 'default'}>
                  {statusLabel(config, ticket.status)}
                </Label>
                <Label
                  variant="soft"
                  color={CRM_TICKET_PRIORITY_COLORS[ticket.priority] ?? 'default'}
                >
                  {priorityLabel(config, ticket.priority)}
                </Label>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {ticket.categoryLabel || categoryLabel(config, ticket.category)}
                </Typography>
              </Stack>
              {ticket.description && (
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}
                >
                  {ticket.description}
                </Typography>
              )}
            </Stack>

            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: 'background.neutral',
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: '1fr 1fr',
              }}
            >
              <Info label="Prazo do SLA">
                <Typography
                  variant="body2"
                  sx={{ color: slaColor(ticket.slaState), fontWeight: 600 }}
                >
                  {ticket.slaState === 'done' ? 'Concluído' : fSlaRemaining(ticket.slaDueAt, now)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {fDateTime(ticket.slaDueAt, 'DD/MM/YYYY HH:mm')} · {ticket.slaHours}h úteis
                </Typography>
              </Info>
              <Info label="Aberto por">
                <CrmTicketCreatedBy createdBy={ticket.createdBy} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {fDateTime(ticket.createdAt, 'DD/MM/YYYY HH:mm')}
                </Typography>
              </Info>
              <Info label="Contato">
                <Typography variant="body2">{ticket.contact?.name || '—'}</Typography>
              </Info>
              <Info label="Aluno">
                <Typography variant="body2">{ticket.student?.name || '—'}</Typography>
              </Info>
              {ticket.resolvedAt && (
                <Info label="Resolvido em">
                  <Typography variant="body2">
                    {fDateTime(ticket.resolvedAt, 'DD/MM/YYYY HH:mm')}
                  </Typography>
                </Info>
              )}
              {ticket.closedAt && (
                <Info label="Fechado em">
                  <Typography variant="body2">
                    {fDateTime(ticket.closedAt, 'DD/MM/YYYY HH:mm')}
                  </Typography>
                </Info>
              )}
            </Box>

            {ticket.conversationId && (
              <Link
                component={RouterLink}
                href={`${paths.dashboard.crm.inbox}?id=${ticket.conversationId}`}
                variant="subtitle2"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}
              >
                <Iconify icon="solar:chat-round-dots-bold" width={18} />
                Abrir conversa
              </Link>
            )}

            <Stack spacing={2}>
              <Typography variant="subtitle2">Atendimento</Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status"
                  value={ticket.status}
                  disabled={saving}
                  onChange={(e) => patch({ status: e.target.value as CrmTicketStatus })}
                >
                  {(config?.statuses.length
                    ? config.statuses.map((s) => s.key)
                    : CRM_TICKET_STATUSES
                  ).map((s) => (
                    <MenuItem key={s} value={s}>
                      {statusLabel(config, s)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Prioridade"
                  value={ticket.priority}
                  disabled={saving}
                  onChange={(e) => patch({ priority: e.target.value as CrmTicketPriority })}
                >
                  {(config?.priorities.length
                    ? config.priorities.map((p) => p.key)
                    : CRM_TICKET_PRIORITIES
                  ).map((p) => (
                    <MenuItem key={p} value={p}>
                      {priorityLabel(config, p)}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <TextField
                select
                size="small"
                label="Categoria"
                value={ticket.category}
                disabled={saving}
                onChange={(e) => patch({ category: e.target.value })}
              >
                {!config?.categories.some((c) => c.key === ticket.category) && (
                  <MenuItem value={ticket.category}>
                    {ticket.categoryLabel || ticket.category}
                  </MenuItem>
                )}
                {(config?.categories ?? []).map((c) => (
                  <MenuItem key={c.key} value={c.key}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Setor"
                value={ticket.departmentId ?? ''}
                disabled={saving}
                onChange={(e) => patch({ departmentId: e.target.value || null })}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">(sem setor)</MenuItem>
                {ticket.departmentId && !departments.some((d) => d.id === ticket.departmentId) && (
                  <MenuItem value={ticket.departmentId}>
                    {ticket.departmentName ?? ticket.departmentId}
                  </MenuItem>
                )}
                {departments
                  .filter((d) => d.active || d.id === ticket.departmentId)
                  .map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Responsável"
                value={ticket.assignee ? agentKey(ticket.assignee) : ''}
                disabled={saving}
                onChange={(e) => {
                  const option = options.find((o) => o.key === e.target.value);
                  patch({ assignee: option ? { type: option.type, id: option.id } : null });
                }}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">(sem responsável)</MenuItem>
                {options.map((o) => (
                  <MenuItem key={o.key} value={o.key}>
                    {o.name || o.id}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2">Nota interna</Typography>
              <TextField
                size="small"
                placeholder="Registre o andamento, um contato feito, uma pendência..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                multiline
                minRows={2}
              />
              <Stack direction="row" justifyContent="flex-end">
                <LoadingButton
                  size="small"
                  variant="contained"
                  loading={saving}
                  disabled={!note.trim()}
                  onClick={addNote}
                >
                  Adicionar nota
                </LoadingButton>
              </Stack>
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Histórico</Typography>
              <TicketTimeline events={ticket.events ?? []} lookup={lookup} />
            </Stack>
          </Stack>
        </Scrollbar>
      )}

      {!loading && !ticket && !error && ticketId && (
        <Box sx={{ p: 2.5 }}>
          <Button onClick={load}>Carregar</Button>
        </Box>
      )}
    </Drawer>
  );
}

// ----------------------------------------------------------------------

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        {label}
      </Typography>
      {children}
    </Stack>
  );
}

const EVENT_TITLES: Record<CrmTicketEvent['type'], string> = {
  created: 'Chamado aberto',
  status: 'Status alterado',
  priority: 'Prioridade alterada',
  category: 'Categoria alterada',
  department: 'Setor alterado',
  assignee: 'Responsável alterado',
  note: 'Nota',
  sla: 'SLA',
};

const EVENT_ICONS: Record<CrmTicketEvent['type'], string> = {
  created: 'solar:add-circle-bold',
  status: 'solar:refresh-circle-bold',
  priority: 'solar:flag-bold',
  category: 'solar:tag-bold',
  department: 'solar:buildings-2-bold',
  assignee: 'solar:user-bold',
  note: 'solar:notes-bold',
  sla: 'solar:alarm-bold',
};

type TimelineProps = {
  events: CrmTicketEvent[];
  lookup: (type: CrmTicketEvent['type'], value: string | null | undefined) => string;
};

function TicketTimeline({ events, lookup }: TimelineProps) {
  if (!events.length) {
    return (
      <Typography variant="body2" sx={{ color: 'text.disabled' }}>
        Sem eventos registrados.
      </Typography>
    );
  }

  const sorted = [...events].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <Stack spacing={0}>
      {sorted.map((event, index) => {
        const slaBreached = event.type === 'sla' && event.to === 'breached';
        const color =
          event.type === 'sla' ? (slaBreached ? 'error.main' : 'warning.main') : 'text.secondary';
        let detail: string | null = null;
        if (event.type === 'sla') {
          detail = slaBreached ? 'SLA estourado' : 'SLA perto de estourar';
        } else if (
          event.type !== 'created' &&
          event.type !== 'note' &&
          (event.from != null || event.to != null)
        ) {
          detail = `${lookup(event.type, event.from)} → ${lookup(event.type, event.to)}`;
        }
        return (
          <Stack key={`${event.at}-${index}`} direction="row" spacing={1.5}>
            <Stack alignItems="center">
              <Iconify
                icon={EVENT_ICONS[event.type] ?? 'solar:record-circle-bold'}
                width={20}
                sx={{ color }}
              />
              {index < sorted.length - 1 && (
                <Box sx={{ flex: 1, width: '1px', bgcolor: 'divider', my: 0.5 }} />
              )}
            </Stack>
            <Stack spacing={0.25} sx={{ pb: 2, minWidth: 0, flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {EVENT_TITLES[event.type] ?? event.type}
              </Typography>
              {detail && (
                <Typography
                  variant="body2"
                  sx={{ color: event.type === 'sla' ? color : 'text.primary' }}
                >
                  {detail}
                </Typography>
              )}
              {event.note && (
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}
                >
                  {event.note}
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {fDateTime(event.at, 'DD/MM/YYYY HH:mm')}
                {event.by?.name ? ` · ${event.by.name}` : ''}
                {event.by?.type === 'ai' ? ' · IA' : ''}
                {!event.by ? ' · sistema' : ''}
              </Typography>
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
}

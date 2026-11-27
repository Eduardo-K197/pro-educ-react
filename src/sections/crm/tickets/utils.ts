import type { CrmAgent } from 'src/types/services/crm';
import type {
  CrmTicket,
  CrmTicketConfig,
  CrmTicketStatus,
  CrmTicketSlaState,
  CrmTicketPriority,
} from 'src/types/services/crm-ticket';

import { CRM_TICKET_STATUS_LABELS, CRM_TICKET_PRIORITY_LABELS } from 'src/types/services/crm-ticket';

// ----------------------------------------------------------------------

/** "2h 15min", "3d 4h", "12min" */
export function fDuration(ms: number) {
  const totalMin = Math.max(0, Math.round(Math.abs(ms) / 60000));
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  if (days > 0) return hours ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return minutes ? `${hours}h ${minutes}min` : `${hours}h`;
  return `${minutes}min`;
}

/** Tempo restante do SLA em texto ("faltam 2h 10min" / "estourado há 35min"). */
export function fSlaRemaining(dueAt: string, now: number) {
  const diff = new Date(dueAt).getTime() - now;
  if (Number.isNaN(diff)) return '—';
  return diff >= 0 ? `faltam ${fDuration(diff)}` : `estourado há ${fDuration(diff)}`;
}

/** Cor do prazo: laranja perto de estourar, vermelho estourado. */
export function slaColor(state: CrmTicketSlaState) {
  if (state === 'breached') return 'error.main';
  if (state === 'warning') return 'warning.main';
  if (state === 'done') return 'text.disabled';
  return 'text.secondary';
}

export const isTicketDone = (status: CrmTicketStatus) => status === 'resolvido' || status === 'fechado';

export const agentKey = (a: { type?: string; userType?: string; id?: string; userId?: string }) =>
  `${a.type ?? a.userType}:${a.id ?? a.userId}`;

export function statusLabel(config: CrmTicketConfig | null, key: string) {
  return (
    config?.statuses.find((s) => s.key === key)?.label ??
    CRM_TICKET_STATUS_LABELS[key as CrmTicketStatus] ??
    key
  );
}

export function priorityLabel(config: CrmTicketConfig | null, key: string) {
  return (
    config?.priorities.find((p) => p.key === key)?.label ??
    CRM_TICKET_PRIORITY_LABELS[key as CrmTicketPriority] ??
    key
  );
}

export function categoryLabel(config: CrmTicketConfig | null, key: string) {
  return config?.categories.find((c) => c.key === key)?.label ?? key;
}

/** Atendentes para atribuição: inclui o responsável atual mesmo que não esteja mais na lista. */
export function assigneeOptions(agents: CrmAgent[], ticket: CrmTicket | null) {
  const options = agents.map((a) => ({ key: agentKey(a), type: a.userType as string, id: a.userId, name: a.name }));
  const current = ticket?.assignee;
  if (current && !options.some((o) => o.key === agentKey(current))) {
    options.unshift({ key: agentKey(current), type: current.type, id: current.id, name: current.name });
  }
  return options;
}

/** "Conta e Matrícula" -> "conta_e_matricula" */
export function slugifyKey(label: string) {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

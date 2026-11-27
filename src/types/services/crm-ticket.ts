// ---------------------------------------------------------------------- ChatFlow: central de chamados

export type CrmTicketStatus =
  | 'aberto'
  | 'em_andamento'
  | 'aguardando_cliente'
  | 'resolvido'
  | 'fechado';

export type CrmTicketPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export type CrmTicketSlaState = 'ok' | 'warning' | 'breached' | 'done';

export type CrmTicketEventType =
  | 'created'
  | 'status'
  | 'priority'
  | 'category'
  | 'department'
  | 'assignee'
  | 'note'
  | 'sla';

export const CRM_TICKET_STATUSES: CrmTicketStatus[] = [
  'aberto',
  'em_andamento',
  'aguardando_cliente',
  'resolvido',
  'fechado',
];

export const CRM_TICKET_PRIORITIES: CrmTicketPriority[] = ['baixa', 'media', 'alta', 'urgente'];

/** Rótulos de reserva (a API também devolve os rótulos em GET /crm/tickets/config). */
export const CRM_TICKET_STATUS_LABELS: Record<CrmTicketStatus, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  aguardando_cliente: 'Aguardando cliente',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
};

export const CRM_TICKET_STATUS_COLORS: Record<
  CrmTicketStatus,
  'info' | 'primary' | 'warning' | 'success' | 'default'
> = {
  aberto: 'info',
  em_andamento: 'primary',
  aguardando_cliente: 'warning',
  resolvido: 'success',
  fechado: 'default',
};

export const CRM_TICKET_PRIORITY_LABELS: Record<CrmTicketPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const CRM_TICKET_PRIORITY_COLORS: Record<
  CrmTicketPriority,
  'default' | 'info' | 'warning' | 'error'
> = {
  baixa: 'default',
  media: 'info',
  alta: 'warning',
  urgente: 'error',
};

export type CrmTicketActor = { type: string; id: string | null; name: string | null };

export type CrmTicketAssignee = { type: string; id: string; name: string | null };

export type CrmTicketEvent = {
  at: string;
  type: CrmTicketEventType;
  from?: string | null;
  to?: string | null;
  note?: string | null;
  by: CrmTicketActor | null;
};

export type CrmTicket = {
  id: string;
  /** Ex.: CH-2026-000123 */
  protocol: string;
  subject: string;
  description: string | null;
  category: string;
  categoryLabel: string;
  priority: CrmTicketPriority;
  status: CrmTicketStatus;
  departmentId: string | null;
  departmentName: string | null;
  assignee: CrmTicketAssignee | null;
  conversationId: string | null;
  contact: { id: string; name: string | null } | null;
  student: { id: number; name: string } | null;
  slaHours: number;
  slaDueAt: string;
  slaState: CrmTicketSlaState;
  createdBy: { type: 'ai' | 'agent'; id: string | null; name: string | null };
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  events?: CrmTicketEvent[];
};

export type CrmTicketCounts = Record<CrmTicketStatus, number>;

export type CrmTicketList = {
  items: CrmTicket[];
  total: number;
  page: number;
  perPage: number;
  counts: CrmTicketCounts;
};

export type CrmTicketFilters = {
  status?: CrmTicketStatus;
  priority?: CrmTicketPriority;
  category?: string;
  departmentId?: string;
  /** "me", "unassigned" ou o id de um usuário. */
  assignee?: string;
  sla?: 'warning' | 'breached';
  search?: string;
  page?: number;
  perPage?: number;
};

export type CrmTicketCreatePayload = {
  subject: string;
  description?: string;
  category: string;
  priority: CrmTicketPriority;
  departmentId?: string;
  conversationId?: string;
};

export type CrmTicketUpdatePayload = {
  status?: CrmTicketStatus;
  priority?: CrmTicketPriority;
  category?: string;
  departmentId?: string | null;
  assignee?: { type: string; id: string } | null;
  note?: string;
};

// ---------------------------------------------------------------------- configuração (categorias e SLA)

export type CrmTicketCategory = { key: string; label: string; departmentId: string | null };

export type CrmTicketSlaMatrix = Record<CrmTicketPriority, number>;

export type CrmTicketConfig = {
  categories: CrmTicketCategory[];
  priorities: { key: CrmTicketPriority; label: string }[];
  statuses: { key: CrmTicketStatus; label: string }[];
  slaHours: {
    default: CrmTicketSlaMatrix;
    byCategory: Record<string, Partial<CrmTicketSlaMatrix>>;
  };
  warnBeforeMinutes: number;
};

export type CrmTicketConfigPayload = Pick<
  CrmTicketConfig,
  'categories' | 'slaHours' | 'warnBeforeMinutes'
>;

// ---------------------------------------------------------------------- tempo real

/** Evento "crm:ticket:updated" do namespace /crm. */
export type CrmTicketUpdatedEvent = { reason: string; ticket: CrmTicket };

/** Evento "crm:ticket:sla" do namespace /crm. */
export type CrmTicketSlaEvent = {
  ticketId: string;
  protocol: string;
  level: 'warning' | 'breached';
  slaDueAt: string;
};

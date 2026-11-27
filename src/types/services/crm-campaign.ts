// ProEduc ChatFlow — templates da Meta, campanhas e relatórios.

// Templates ---------------------------------------------------------------

export type CrmWaTemplateComponent = {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS' | string;
  format?: string;
  text?: string;
  buttons?: { type: string; text: string; url?: string; phone_number?: string }[];
  example?: unknown;
};

export type CrmWaTemplate = {
  id: string;
  channelId: string;
  name: string;
  language: string;
  category: string | null;
  status: string;
  parameterFormat: 'POSITIONAL' | 'NAMED';
  components: CrmWaTemplateComponent[];
  /** Chaves das variáveis: "header.1", "body.1", "body.nome"... */
  variables: string[];
  bodyText: string | null;
  rejectedReason: string | null;
  syncedAt: string | null;
};

export const CRM_TEMPLATE_STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Aprovado',
  PENDING: 'Em análise',
  REJECTED: 'Rejeitado',
  PAUSED: 'Pausado',
  DISABLED: 'Desativado',
  IN_APPEAL: 'Em recurso',
};

export const CRM_TEMPLATE_CATEGORY_LABELS: Record<string, string> = {
  MARKETING: 'Marketing',
  UTILITY: 'Utilidade',
  AUTHENTICATION: 'Autenticação',
};

// Campanhas ----------------------------------------------------------------

export type CrmCampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'canceled';

export const CRM_CAMPAIGN_STATUS_LABELS: Record<CrmCampaignStatus, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  running: 'Enviando',
  paused: 'Pausada',
  completed: 'Concluída',
  canceled: 'Cancelada',
};

export type CrmRecipientStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed' | 'skipped';

export const CRM_RECIPIENT_STATUS_LABELS: Record<CrmRecipientStatus, string> = {
  pending: 'Aguardando',
  queued: 'Na fila',
  sent: 'Enviada',
  delivered: 'Entregue',
  read: 'Lida',
  replied: 'Respondeu',
  failed: 'Falhou',
  skipped: 'Ignorada',
};

export type CrmCampaignAudience =
  | { type: 'all_guardians' }
  | { type: 'classroom'; classroomIds: string[] }
  | { type: 'course'; courseIds: string[] }
  | { type: 'overdue'; minDaysOverdue?: number }
  | { type: 'tag'; tagIds: string[] }
  | { type: 'csv'; csv: string };

export type CrmCampaignAudienceType = CrmCampaignAudience['type'];

export const CRM_AUDIENCE_LABELS: Record<CrmCampaignAudienceType, string> = {
  all_guardians: 'Todos os responsáveis ativos',
  classroom: 'Por turma',
  course: 'Por curso',
  overdue: 'Inadimplentes',
  tag: 'Por tag de contato',
  csv: 'Importar CSV',
};

export type CrmCampaignVariableMapping = Record<string, { source: string; value?: string }>;

export type CrmCampaignStats = {
  total: number;
  pending: number;
  queued: number;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  failed: number;
  skipped: number;
};

export type CrmCampaign = {
  id: string;
  name: string;
  channelId: string;
  channelName: string | null;
  templateId: string;
  templateName: string;
  templateLanguage: string;
  status: CrmCampaignStatus;
  audience: CrmCampaignAudience | null;
  variables: CrmCampaignVariableMapping;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  ratePerMinute: number;
  lastError: string | null;
  createdByName: string | null;
  createdAt: string;
  stats: CrmCampaignStats;
};

export type CrmCampaignOptions = {
  channels: { id: string; name: string; type: string; official: boolean; eligible: boolean; reason: string | null }[];
  classrooms: { id: string; name: string; courseName: string | null }[];
  courses: { id: string; name: string }[];
  tags: { id: string; name: string; color: string }[];
  sources: { key: string; label: string }[];
  defaults: { ratePerMinute: number; maxRatePerMinute: number; dailyLimit: number };
};

export type CrmCampaignPayload = {
  name: string;
  channelId: string;
  templateId: string;
  variables: CrmCampaignVariableMapping;
  audience: CrmCampaignAudience;
  scheduledAt: string | null;
  ratePerMinute: number;
};

export type CrmAudiencePreview = {
  total: number;
  optedOut: number;
  invalid: number;
  duplicates: number;
  sample: { phone: string; name: string | null; variables: Record<string, string> }[];
};

export type CrmCampaignRecipient = {
  id: string;
  phone: string;
  name: string | null;
  status: CrmRecipientStatus;
  error: string | null;
  variables: Record<string, string> | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  repliedAt: string | null;
};

// Relatórios ---------------------------------------------------------------

export type CrmReportFilters = {
  from: string;
  to: string;
  departmentId?: string;
  userId?: string;
  channelId?: string;
};

export type CrmReportGroup = {
  id: string | null;
  name: string | null;
  conversations: number;
  closed: number;
  avgFirstResponseSec: number | null;
  p90FirstResponseSec: number | null;
  avgResolutionSec: number | null;
  avgRating: number | null;
};

export type CrmReportDuration = { avgSec: number | null; p90Sec: number | null; count: number };

export type CrmReport = {
  period: { from: string; to: string };
  totals: {
    conversations: number;
    closed: number;
    open: number;
    pending: number;
    firstResponse: CrmReportDuration;
    resolution: CrmReportDuration;
    rating: { avg: number | null; count: number; distribution: Record<string, number> };
    resolvedBy: { ai: number; human: number; none: number; aiPct: number; humanPct: number };
  };
  byDay: { date: string; conversations: number; closed: number }[];
  byDepartment: CrmReportGroup[];
  byAgent: CrmReportGroup[];
  byChannel: CrmReportGroup[];
  peakHours: { byHour: number[]; byWeekdayHour: number[][] };
};

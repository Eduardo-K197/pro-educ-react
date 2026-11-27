import type { CrmUserType } from './crm';

// ----------------------------------------------------------------------
// Funil comercial do CRM (leads, etapas, tarefas)

export type CrmStageKind = 'open' | 'won' | 'lost';
export type CrmDealStatus = 'open' | 'won' | 'lost';
export type CrmTaskStatus = 'open' | 'done' | 'canceled';

export type CrmPipelineStage = {
  id: string;
  pipelineId: string;
  name: string;
  color: string;
  probability: number;
  kind: CrmStageKind;
  position: number;
  active: boolean;
};

export type CrmPipeline = {
  id: string;
  name: string;
  isDefault: boolean;
  agentsSeeAll: boolean;
  stalledDays: number;
  active: boolean;
  position: number;
  stages: CrmPipelineStage[];
};

export type CrmStageInput = {
  id?: string;
  name: string;
  color?: string;
  probability?: number;
  kind: CrmStageKind;
};

export type CrmPerson = { type: CrmUserType | string; id: string; name: string | null };

export type CrmDeal = {
  id: string;
  pipelineId: string;
  stageId: string;
  stage: { name: string; color: string; kind: CrmStageKind; probability: number } | null;
  status: CrmDealStatus;
  title: string;
  contactId: string | null;
  conversationId: string | null;
  studentName: string | null;
  studentBirthDate: string | null;
  interestCourseId: string | null;
  interestLabel: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  source: string | null;
  estimatedValue: number | null;
  weightedValue: number | null;
  owner: CrmPerson | null;
  expectedCloseAt: string | null;
  lostReason: string | null;
  lostAt: string | null;
  wonAt: string | null;
  convertedStudentId: number | null;
  convertedAt: string | null;
  lastInteractionAt: string | null;
  stageChangedAt: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  tags: { id: string; name: string; color: string }[];
  contact: { id: string; name: string; phone: string | null; avatarUrl: string | null; studentId: number | null } | null;
  openTasks: number;
  nextTaskAt: string | null;
};

export type CrmDealPayload = {
  title?: string | null;
  pipelineId?: string | null;
  stageId?: string | null;
  contactId?: string | null;
  studentName?: string | null;
  studentBirthDate?: string | null;
  interestCourseId?: string | null;
  interestLabel?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianEmail?: string | null;
  source?: string | null;
  estimatedValue?: number | null;
  expectedCloseAt?: string | null;
  description?: string | null;
  owner?: { userType: string; userId: string } | null;
  tagIds?: string[];
  lostReason?: string | null;
};

export type CrmDealFilters = {
  pipelineId?: string;
  stageId?: string;
  status?: string;
  owner?: string;
  ownerUserId?: string;
  source?: string;
  tagId?: string;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  perPage?: number;
};

export type CrmDealList = { data: CrmDeal[]; total: number; page: number; perPage: number };

export type CrmBoard = { pipeline: CrmPipeline; pipelines: CrmPipeline[]; deals: CrmDeal[]; truncated: boolean };

export type CrmDealEventType =
  | 'created'
  | 'stage'
  | 'owner'
  | 'updated'
  | 'won'
  | 'lost'
  | 'reopened'
  | 'converted'
  | 'linked'
  | 'task_done';

export type CrmDealEvent = {
  id: string;
  type: CrmDealEventType;
  text: string | null;
  fromStageId: string | null;
  toStageId: string | null;
  data: Record<string, unknown> | null;
  author: CrmPerson | null;
  createdAt: string;
};

export type CrmDealNote = { id: string; body: string; author: CrmPerson; createdAt: string };

export type CrmTask = {
  id: string;
  dealId: string | null;
  deal?: { id: string; title: string; status: CrmDealStatus };
  studentId: number | null;
  student?: { id: number; name: string };
  title: string;
  description: string | null;
  dueAt: string | null;
  status: CrmTaskStatus;
  completedAt: string | null;
  assignee: CrmPerson;
  createdBy: CrmPerson | null;
  overdue: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CrmTaskPayload = {
  dealId?: string | null;
  studentId?: number | null;
  title?: string;
  description?: string | null;
  dueAt?: string | null;
  status?: CrmTaskStatus;
  assignee?: { userType: string; userId: string } | null;
};

export type CrmDealDetail = {
  deal: CrmDeal;
  pipeline: CrmPipeline;
  convertedStudent: { id: number; name: string } | null;
  events: CrmDealEvent[];
  notes: CrmDealNote[];
  tasks: CrmTask[];
};

export type CrmStudentOption = { id: number; name: string; birthDate: string | null; status: string; guardianName: string | null };

export type CrmDealSocketPayload = { reason: string; deal: CrmDeal | { id: string; pipelineId: string; deleted: true } };

export const CRM_DEAL_SOURCES: { value: string; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'site', label: 'Site' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'evento', label: 'Evento' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'redes_sociais', label: 'Redes sociais' },
  { value: 'outro', label: 'Outro' },
];

export const CRM_DEAL_SOURCE_LABELS: Record<string, string> = Object.fromEntries(CRM_DEAL_SOURCES.map((s) => [s.value, s.label]));

export const CRM_DEAL_STATUS_LABELS: Record<CrmDealStatus, string> = { open: 'Em andamento', won: 'Ganho', lost: 'Perdido' };

export const CRM_STAGE_KIND_LABELS: Record<CrmStageKind, string> = { open: 'Em andamento', won: 'Ganho', lost: 'Perda' };

export function isDeletedDeal(deal: CrmDealSocketPayload['deal']): deal is { id: string; pipelineId: string; deleted: true } {
  return 'deleted' in deal && deal.deleted === true;
}

// ----------------------------------------------------------------------
// Growth: configurações, recuperação e retenção

export type GrowthSettings = {
  lostRecentDays: number;
  absenceWindowDays: number;
  absenceRatePercent: number;
  absenceMinClasses: number;
  overdueGraceDays: number;
};

/** `days` = null e `byPipeline` = true quando os parados seguem o prazo de cada funil. */
export type GrowthRecovery = CrmDealList & { type: 'stalled' | 'lost'; days: number | null; byPipeline: boolean };

export type GrowthRiskReason = 'inadimplencia' | 'faltas';

export type GrowthStudentAtRisk = {
  student: { id: number; name: string; status: string; phoneNumber: string | null };
  guardian: { id: string; name: string | null; phoneNumber: string | null } | null;
  level: 'alto' | 'medio';
  reasons: GrowthRiskReason[];
  score: number;
  absenceRate: number | null;
  signals: { overdueCount: number; overdueTotal: number; oldestOverdueDays: number | null; absences: number; classes: number };
  openTasks: number;
};

export type GrowthRetentionList = { settings: GrowthSettings; data: GrowthStudentAtRisk[] };

export const GROWTH_RISK_LABELS: Record<GrowthRiskReason, string> = { inadimplencia: 'Inadimplência', faltas: 'Faltas' };

export type GrowthOwner = { userType: string; userId: string; name: string; role: string };

export type GrowthCourse = { id: string; name: string };

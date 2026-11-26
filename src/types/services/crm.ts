export type CrmRole = 'agente' | 'supervisor' | 'gestor';
export type CrmUserType = 'admin' | 'employee' | 'teacher';

export type CrmMe = {
  schoolId: string;
  user: { type: CrmUserType | 'superAdmin'; id: string; name?: string };
  role: CrmRole | null;
  implicit: boolean;
  memberId: string | null;
  departmentIds: string[];
  roles: CrmRole[];
  permissions: { access: boolean; supervise: boolean; manage: boolean };
  realtime: { path: string; namespace: string };
  features: { queues: boolean; redis: boolean };
};

export type CrmDepartment = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  greetingMessage?: string | null;
  outOfHoursMessage?: string | null;
  businessHours?: { timezone?: string; days: Record<string, [string, string][]> } | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CrmDepartmentPayload = {
  name?: string;
  description?: string | null;
  active?: boolean;
  greetingMessage?: string | null;
  outOfHoursMessage?: string | null;
  businessHours?: { timezone?: string; days: Record<string, [string, string][]> } | null;
};

export type CrmMember = {
  id: string;
  userType: CrmUserType;
  userId: string;
  name: string | null;
  email: string | null;
  role: CrmRole;
  active: boolean;
  departments: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
};

export type CrmMemberCreatePayload = {
  userType: CrmUserType;
  userId: string;
  role: CrmRole;
  active?: boolean;
  departmentIds?: string[];
};

export type CrmMemberUpdatePayload = {
  role?: CrmRole;
  active?: boolean;
  departmentIds?: string[];
};

export type CrmCandidate = {
  userType: CrmUserType;
  userId: string;
  name: string;
  email?: string;
};

export const CRM_ROLE_LABELS: Record<CrmRole, string> = {
  agente: 'Agente',
  supervisor: 'Supervisor',
  gestor: 'Gestor',
};

export const CRM_USER_TYPE_LABELS: Record<CrmUserType, string> = {
  admin: 'Administrador',
  employee: 'Funcionário',
  teacher: 'Professor',
};

// ---------------------------------------------------------------------- Fase 1: atendimento

export type CrmBusinessHours = { timezone?: string; days: Record<string, [string, string][]> };

export type CrmDepartmentAutomation = {
  greetingMessage?: string | null;
  outOfHoursMessage?: string | null;
  businessHours?: CrmBusinessHours | null;
};

export type CrmConversationStatus = 'bot' | 'pending' | 'open' | 'closed';

export const CRM_CONVERSATION_STATUS_LABELS: Record<CrmConversationStatus, string> = {
  bot: 'No menu',
  pending: 'Pendente',
  open: 'Em atendimento',
  closed: 'Encerrada',
};

export type CrmTag = { id: string; name: string; color: string; usage?: number };

export type CrmConversationChannel = {
  id: string;
  name?: string;
  type?: string;
  official?: boolean;
  canInitiate?: boolean;
  freeformWindowHours?: number | null;
  agentsSeeUnassigned?: boolean;
  deleted?: boolean;
};

export type CrmConversation = {
  id: string;
  protocol: string;
  status: CrmConversationStatus;
  channel: CrmConversationChannel;
  departmentId: string | null;
  departmentName: string | null;
  assignee: { type: string; id: string; name: string | null } | null;
  contact: {
    id: string;
    name?: string;
    phone?: string | null;
    avatarUrl?: string | null;
    studentId?: number | null;
    guardianId?: string | null;
  };
  unreadCount: number;
  lastMessage: { preview: string | null; direction: string | null; at: string } | null;
  lastInboundAt: string | null;
  queuedAt: string | null;
  startedAt: string | null;
  firstResponseAt: string | null;
  closedAt: string | null;
  rating: number | null;
  ratingComment: string | null;
  tags: CrmTag[];
  createdAt: string;
  updatedAt: string;
};

export type CrmConversationList = {
  data: CrmConversation[];
  total: number;
  page: number;
  perPage: number;
  counts: Record<CrmConversationStatus, number>;
};

export type CrmConversationFilters = {
  status?: string;
  departmentId?: string;
  assignee?: string;
  tagId?: string;
  search?: string;
  channelId?: string;
  page?: number;
  perPage?: number;
};

export type CrmMessageStatus =
  | 'pending'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'played'
  | 'failed'
  | 'received';

export type CrmMessage = {
  id: string;
  conversationId: string;
  direction: 'in' | 'out' | 'sys';
  type: string;
  body: string | null;
  media: { key: string | null; mimeType: string | null; fileName: string | null; size: number | null } | null;
  status: CrmMessageStatus;
  error: string | null;
  quotedMessageId: string | null;
  quoted?: { id: string; body: string | null; type: string; direction: string } | null;
  author: { type: string; id: string; name: string | null } | null;
  source: string;
  edited: boolean;
  deleted: boolean;
  reaction: string | null;
  location: { latitude: number; longitude: number; name?: string } | null;
  vCards: string[] | null;
  event: Record<string, unknown> | null;
  sentAt: string | null;
  createdAt: string;
};

export type CrmNote = {
  id: string;
  body: string;
  author: { type: string; id: string; name: string | null };
  createdAt: string;
};

export type CrmQuickReply = {
  id: string;
  shortcut: string;
  body: string;
  scope: 'school' | 'user';
  media: { key: string; mimeType: string | null; fileName: string | null } | null;
  mine: boolean;
  editable: boolean;
  updatedAt: string;
};

export type CrmQuickReplyPayload = {
  shortcut?: string;
  body?: string;
  scope?: 'school' | 'user';
};

export type CrmStudentSummary = {
  id: number;
  name: string;
  status: string;
  guardian: { id: string; name: string | null } | null;
  classrooms: { id: string; name: string | null }[];
  financial: {
    overdueCount: number;
    overdueTotal: number;
    nextDue: { dueDate: string | null; value: number } | null;
    situation: 'inadimplente' | 'em_dia';
  };
};

export type CrmContact = {
  id: string;
  name: string | null;
  profileName: string | null;
  displayName: string;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  notes: string | null;
  studentId: number | null;
  guardianId: string | null;
  lastInboundAt: string | null;
  tags: CrmTag[];
  createdAt: string;
};

export type CrmContactDetail = CrmContact & {
  student: CrmStudentSummary | null;
  guardian: { id: string; name: string | null; students: { id: number; name: string; status: string }[] } | null;
  history: { id: string; protocol: string; status: CrmConversationStatus; createdAt: string; closedAt: string | null; rating: number | null }[];
};

export type CrmContactPayload = {
  name?: string | null;
  email?: string | null;
  notes?: string | null;
  studentId?: number | null;
  guardianId?: string | null;
};

export type CrmLinkSearch = {
  students: { id: number; name: string; status: string; phone: string | null }[];
  guardians: { id: string; name: string | null; students: string[] }[];
};

export type CrmAgent = {
  userType: CrmUserType;
  userId: string;
  name: string | null;
  role: CrmRole;
  departments: { id: string; name: string }[];
};

export type CrmChannelState =
  | 'not_configured'
  | 'disconnected'
  | 'connecting'
  | 'qr_required'
  | 'connected'
  | 'error';

export const CRM_CHANNEL_STATE_LABELS: Record<CrmChannelState, string> = {
  not_configured: 'Não configurado',
  disconnected: 'Desconectado',
  connecting: 'Conectando',
  qr_required: 'Aguardando leitura do QR',
  connected: 'Conectado',
  error: 'Erro',
};

export type CrmChannelCapabilities = {
  official: boolean;
  canInitiate: boolean;
  templates: boolean;
  qrPairing: boolean;
  typing: boolean;
  readReceipts: boolean;
  freeformWindowHours: number | null;
};

export type CrmChannelAutomation = {
  defaultDepartmentId: string | null;
  greetingMessage: string | null;
  closingMessage: string | null;
  botMenuEnabled: boolean;
  botMenuMessage: string | null;
  ratingEnabled: boolean;
  agentsSeeUnassigned: boolean;
};

export type CrmChannel = {
  id: string;
  type: string;
  providerName: string;
  capabilities: CrmChannelCapabilities;
  name: string;
  status: CrmChannelState;
  externalId: string | null;
  lastError: string | null;
  config: Record<string, any>;
  webhookUrl: string;
  automation: CrmChannelAutomation;
  createdAt: string;
  updatedAt: string;
  connection?: { state: CrmChannelState; detail?: string };
};

export type CrmChannelSummary = {
  id: string;
  name: string;
  type: string;
  status: CrmChannelState;
  official: boolean;
  canInitiate: boolean;
  templates: boolean;
};

export type CrmChannelPayload = Partial<Omit<CrmChannelAutomation, 'defaultDepartmentId'>> & {
  type?: string;
  name?: string;
  config?: Record<string, unknown>;
  defaultDepartmentId?: string | null;
};

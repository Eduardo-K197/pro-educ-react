// ---------------------------------------------------------------------- ProEduc Intelligence (IA no CRM)

export type CrmAiMode = 'shadow' | 'suggest' | 'execute';

export type CrmAiDecision = 'reply' | 'handoff' | 'skip' | 'error';

export type CrmAiPurpose = 'triage' | 'agent' | 'summary';

export const CRM_AI_MODULE_LABEL = 'ProEduc Intelligence';

export const CRM_AI_MODE_LABELS: Record<CrmAiMode, string> = {
  shadow: 'Observação',
  suggest: 'Sugestão',
  execute: 'Automático',
};

/** Explicação simples de cada modo (tela de configuração). */
export const CRM_AI_MODE_DESCRIPTIONS: Record<CrmAiMode, string> = {
  shadow:
    'A IA lê as conversas e registra no histórico o que responderia, mas não mostra nada para a equipe nem fala com o contato. Bom para avaliar antes de usar.',
  suggest:
    'A IA sugere a resposta para o atendente na tela de atendimento. Quem decide e envia é sempre uma pessoa.',
  execute:
    'A IA responde o contato sozinha e encaminha para um atendente quando não souber ou quando o contato pedir.',
};

export const CRM_AI_DECISION_LABELS: Record<CrmAiDecision, string> = {
  reply: 'Respondeu',
  handoff: 'Encaminhou',
  skip: 'Ignorou',
  error: 'Erro',
};

export const CRM_AI_DECISION_COLORS: Record<CrmAiDecision, 'success' | 'warning' | 'default' | 'error'> = {
  reply: 'success',
  handoff: 'warning',
  skip: 'default',
  error: 'error',
};

export const CRM_AI_PURPOSE_LABELS: Record<CrmAiPurpose, string> = {
  triage: 'Triagem',
  agent: 'Resposta',
  summary: 'Resumo',
};

export type CrmAiUsage = {
  since: string;
  tokens: number;
  costUsd: number;
  runs: number;
  byDecision: Record<CrmAiDecision, number>;
};

export type CrmAiSettings = {
  enabled: boolean;
  mode: CrmAiMode;
  persona: string | null;
  instructions: string | null;
  handoffDepartmentId: string | null;
  /** 0 = sem teto. */
  monthlyTokenBudget: number;
  enabledTools: string[];
  providerConfigured: boolean;
  updatedAt: string | null;
  schoolId: string;
  usage: CrmAiUsage;
};

export type CrmAiSettingsPayload = {
  enabled?: boolean;
  mode?: CrmAiMode;
  persona?: string | null;
  instructions?: string | null;
  handoffDepartmentId?: string | null;
  monthlyTokenBudget?: number;
};

export type CrmAiCitation = { chunkId: string; documentId: string; title: string };

export type CrmAiRun = {
  id: string;
  useCase: string;
  conversationId: string | null;
  messageId: string | null;
  mode: CrmAiMode | string;
  purpose: CrmAiPurpose | null;
  provider: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number | null;
  latencyMs: number | null;
  decision: CrmAiDecision;
  reason: string | null;
  suggestedText: string | null;
  citations: CrmAiCitation[] | null;
  createdAt: string;
};

export type CrmAiRunFilters = {
  conversationId?: string;
  decision?: CrmAiDecision;
  mode?: CrmAiMode;
  /** YYYY-MM-DD */
  from?: string;
  /** YYYY-MM-DD */
  to?: string;
  page?: number;
  perPage?: number;
};

export type CrmAiRunList = {
  items: CrmAiRun[];
  total: number;
  page: number;
  perPage: number;
};

// ---------------------------------------------------------------------- base de conhecimento

export type CrmAiKbKind = 'faq' | 'text' | 'file';

export type CrmAiKbStatus = 'pending' | 'indexing' | 'ready' | 'error';

export const CRM_AI_KB_KIND_LABELS: Record<CrmAiKbKind, string> = {
  faq: 'FAQ',
  text: 'Texto',
  file: 'Arquivo',
};

export const CRM_AI_KB_STATUS_LABELS: Record<CrmAiKbStatus, string> = {
  pending: 'Na fila',
  indexing: 'Indexando',
  ready: 'Pronto',
  error: 'Erro',
};

export const CRM_AI_KB_STATUS_COLORS: Record<CrmAiKbStatus, 'default' | 'info' | 'success' | 'error'> = {
  pending: 'default',
  indexing: 'info',
  ready: 'success',
  error: 'error',
};

export type CrmAiKbDocument = {
  id: string;
  title: string;
  kind: CrmAiKbKind;
  fileName: string | null;
  mimeType: string | null;
  status: CrmAiKbStatus;
  error: string | null;
  chunkCount: number;
  charCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CrmAiKbDocumentDetail = CrmAiKbDocument & { content: string };

export type CrmAiKbCreatePayload = {
  title: string;
  kind: 'faq' | 'text';
  content: string;
};

export type CrmAiKbUpdatePayload = {
  title?: string;
  content?: string;
  active?: boolean;
};

export type CrmAiKbSearchResult = {
  chunkId: string;
  documentId: string;
  title: string;
  text: string;
  score: number;
};

// ---------------------------------------------------------------------- tempo real

/** Evento "crm:ai:suggestion" do namespace /crm. */
export type CrmAiSuggestion = {
  conversationId: string;
  runId: string;
  decision: 'reply' | 'handoff';
  text: string | null;
  reason: string | null;
  citations?: CrmAiCitation[];
  at: string;
};

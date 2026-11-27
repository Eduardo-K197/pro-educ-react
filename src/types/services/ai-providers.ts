// ----------------------------------------------------------------------
// Provedores de IA (configuração global da plataforma, só SuperAdmin).
// ----------------------------------------------------------------------

export type AiProviderName = 'gemini' | 'openai' | 'anthropic';

export type AiPurpose = 'triage' | 'agent' | 'summary';

export type AiKeySource = 'db' | 'env';

export type AiTestError =
  | 'auth'
  | 'rate_limit'
  | 'timeout'
  | 'overloaded'
  | 'unavailable'
  | 'bad_request'
  | 'refusal'
  | 'invalid_response'
  | 'not_configured'
  | 'unknown';

export type AiProviderStored = {
  enabled: boolean;
  keyHint: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type AiProviderLastTest = {
  at: string;
  ok: boolean;
  error: string | null;
};

export type AiProviderInfo = {
  provider: AiProviderName;
  label: string;
  models: string[];
  envVar: string;
  configured: boolean;
  source: AiKeySource | null;
  keyHint: string | null;
  stored: AiProviderStored | null;
  lastTest: AiProviderLastTest | null;
};

export type AiModelRow = {
  id: string;
  provider: AiProviderName;
  model: string;
  priority: number;
  enabled: boolean;
  options: Record<string, unknown> | null;
};

export type AiProvidersState = {
  providers: AiProviderInfo[];
  purposes: Record<AiPurpose, AiModelRow[]>;
};

export type AiProviderUpdatePayload = {
  apiKey?: string;
  enabled?: boolean;
};

export type AiProviderTestPayload = {
  apiKey?: string;
  model?: string;
};

export type AiProviderTestResult = {
  ok: boolean;
  provider: AiProviderName;
  model: string;
  latencyMs: number;
  error?: AiTestError;
};

export type AiModelChainItem = {
  provider: AiProviderName;
  model: string;
  enabled?: boolean;
  options?: Record<string, unknown> | null;
};

export type AiModelConfigPayload = {
  chain: AiModelChainItem[];
};

// ----------------------------------------------------------------------

export const AI_PURPOSES: AiPurpose[] = ['triage', 'agent', 'summary'];

export const AI_PURPOSE_LABELS: Record<AiPurpose, string> = {
  triage: 'Triagem',
  agent: 'Atendimento',
  summary: 'Resumo',
};

export const AI_PURPOSE_DESCRIPTIONS: Record<AiPurpose, string> = {
  triage: 'Classifica a mensagem recebida e decide o encaminhamento.',
  agent: 'Gera as respostas do autoatendimento.',
  summary: 'Resume conversas para a equipe.',
};

export const AI_PROVIDER_FALLBACK_LABELS: Record<AiProviderName, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};

export const AI_TEST_ERROR_LABELS: Record<AiTestError, string> = {
  auth: 'Chave inválida ou sem permissão',
  rate_limit: 'Limite de requisições ou cota atingido',
  timeout: 'O provedor demorou demais para responder',
  overloaded: 'Provedor sobrecarregado no momento; tente de novo em instantes',
  unavailable: 'Provedor indisponível no momento',
  bad_request: 'Requisição recusada (modelo inexistente ou parâmetro inválido)',
  refusal: 'O modelo recusou a resposta de teste',
  invalid_response: 'O provedor devolveu uma resposta inválida',
  not_configured: 'Nenhuma chave configurada para este provedor',
  unknown: 'Erro desconhecido ao testar a chave',
};

export function aiTestErrorLabel(error: string | null | undefined): string {
  if (!error) return AI_TEST_ERROR_LABELS.unknown;
  return (AI_TEST_ERROR_LABELS as Record<string, string>)[error] ?? error;
}

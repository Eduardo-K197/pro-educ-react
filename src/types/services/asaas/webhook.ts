// src/types/webhook.ts

// ---- WEBHOOKS DIRETO DO ASAAS (index + update) ----

export type AsaasWebhookEvent =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_PARTIALLY_REFUNDED'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_RESTORED'
  | 'PAYMENT_RECEIVED_IN_CASH_UNDONE'
  | string; // fallback pra qualquer outro que o Asaas adicionar

export interface IAsaasWebhook {
  id: string;
  name: string;
  url: string;
  email: string;
  enabled: boolean;
  interrupted: boolean;
  events: AsaasWebhookEvent[];

  // campos adicionais comuns do Asaas, se quiser usar depois
  apiVersion?: string;
  sendType?: 'SEQUENTIALLY' | 'NON_SEQUENTIALLY';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface IAsaasWebhookListResponse {
  object: 'list';
  hasMore: boolean;
  totalCount?: number;
  limit?: number;
  offset?: number;
  data: IAsaasWebhook[];
}

// Alias pra ficar semântico no service
export type GetWebhooksResponse = IAsaasWebhookListResponse;
export type UpdateWebhookResponse = IAsaasWebhook;


// ---- WEBHOOKS AGREGADOS DE TODAS AS ESCOLAS (indexAll) ----

export type IWebhookSchoolStatus =
  | 'NONE'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'UNCONFIGURED'
  | 'UNKNOWN';

export interface IWebhookSchoolWebhook {
  id: string;
  name: string;
  email: string;
  enabled: boolean;
  interrupted: boolean;
  eventsCount: number;
  url: string;
}

export interface IWebhookIndexAllItemBase {
  ok: boolean;
  schoolId: string | null;
  schoolName: string | null;
  status: IWebhookSchoolStatus;
  count: number;
  webhooks: IWebhookSchoolWebhook[];
}

export interface IWebhookIndexAllItemOk extends IWebhookIndexAllItemBase {
  ok: true;
  errorStatus?: undefined;
  error?: undefined;
}

export interface IWebhookIndexAllItemError extends IWebhookIndexAllItemBase {
  ok: false;
  errorStatus: number;
  // pode ser string ou objeto vindo do Asaas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
}

export type IWebhookIndexAllItem =
  | IWebhookIndexAllItemOk
  | IWebhookIndexAllItemError;

export interface IWebhookIndexAllSummary {
  [status: string]: number; // ex: ACTIVE, UNKNOWN, UNCONFIGURED...
}

export interface IWebhookIndexAllResponse {
  totalSchools: number;
  processed: number;
  ok: number;
  failed: number;
  summary: IWebhookIndexAllSummary;
  items: IWebhookIndexAllItem[];
}

// src/types/services/asaas/webhook.ts

export interface IWebhookItem {
  id: string;
  name: string;
  email: string;
  enabled: boolean;
  interrupted: boolean;
  eventsCount: number;
  url: string;
}

export interface ISchoolWebhooks {
  ok: boolean;
  schoolId: string;
  schoolName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'UNKNOWN';
  count: number;
  webhooks: IWebhookItem[];
}

export interface GetAllSchoolsWebhooksResponse {
  totalSchools: number;
  processed: number;
  ok: number;
  failed: number;
  summary: {
    ACTIVE: number;
    INACTIVE?: number;
    UNKNOWN?: number;
  };
  items: ISchoolWebhooks[];
}

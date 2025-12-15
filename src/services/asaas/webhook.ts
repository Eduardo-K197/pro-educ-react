import type { AxiosRequestConfig } from 'axios';
import type {
  IAsaasWebhook,
  GetWebhooksResponse,
  UpdateWebhookResponse,
  GetAllSchoolsWebhooksResponse,
} from 'src/types/services/asaas/webhook';

import { ApiService } from 'src/services/api/api';

export class WebhookService {
  private static readonly BASE_PATH = '/webhooks/asaas';

  /**
   * Lista webhooks da escola logada
   * GET /webhooks/asaas
   */
  static async listMine(
    params?: { limit?: number; offset?: number },
    config?: AxiosRequestConfig
  ): Promise<GetWebhooksResponse> {
    return ApiService.get<GetWebhooksResponse>(this.BASE_PATH, params, config);
  }

  /**
   * Lista webhooks de TODAS as escolas
   * GET /webhooks/asaas/all
   */
  static async listAll(
    params?: {
      status?: 'ACTIVE' | 'INACTIVE';
      limit?: number;
      offset?: number;
    },
    config?: AxiosRequestConfig
  ): Promise<GetAllSchoolsWebhooksResponse> {
    return ApiService.get<GetAllSchoolsWebhooksResponse>(`${this.BASE_PATH}/all`, params, config);
  }

  /**
   * Atualiza (habilita / reativa) um webhook
   * PUT /webhooks/asaas/:id
   */
  static async enable(id: string, config?: AxiosRequestConfig): Promise<UpdateWebhookResponse> {
    return ApiService.put<Partial<IAsaasWebhook>, UpdateWebhookResponse>(
      `${this.BASE_PATH}/${id}`,
      {},
      config
    );
  }
}

import type {
  CrmTicket,
  CrmTicketList,
  CrmTicketConfig,
  CrmTicketFilters,
  CrmTicketCreatePayload,
  CrmTicketUpdatePayload,
  CrmTicketConfigPayload,
} from 'src/types/services/crm-ticket';

import { ApiService } from './api/api';

import type { QueryParams } from './api/api';

/** ChatFlow: central de chamados (módulo "crm"). A API filtra o que cada membro enxerga. */
export class CrmTicketService {
  private static readonly BASE_PATH = '/crm/tickets';

  static list(filters: CrmTicketFilters): Promise<CrmTicketList> {
    return ApiService.get<CrmTicketList>(this.BASE_PATH, filters as QueryParams);
  }

  static get(id: string): Promise<CrmTicket> {
    return ApiService.get<CrmTicket>(`${this.BASE_PATH}/${id}`);
  }

  static create(payload: CrmTicketCreatePayload): Promise<CrmTicket> {
    return ApiService.post<CrmTicketCreatePayload, CrmTicket>(this.BASE_PATH, payload);
  }

  static update(id: string, payload: CrmTicketUpdatePayload): Promise<CrmTicket> {
    return ApiService.patch<CrmTicketUpdatePayload, CrmTicket>(`${this.BASE_PATH}/${id}`, payload);
  }

  // Configuração (categorias e SLA) -----------------------------------------

  static getConfig(): Promise<CrmTicketConfig> {
    return ApiService.get<CrmTicketConfig>(`${this.BASE_PATH}/config`);
  }

  static updateConfig(payload: CrmTicketConfigPayload): Promise<CrmTicketConfig> {
    return ApiService.put<CrmTicketConfigPayload, CrmTicketConfig>(`${this.BASE_PATH}/config`, payload);
  }
}

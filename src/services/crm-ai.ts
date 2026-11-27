import type {
  CrmAiRunList,
  CrmAiSettings,
  CrmAiKbDocument,
  CrmAiRunFilters,
  CrmAiKbSearchResult,
  CrmAiKbCreatePayload,
  CrmAiKbUpdatePayload,
  CrmAiSettingsPayload,
  CrmAiKbDocumentDetail,
} from 'src/types/services/crm-ai';

import { ApiService } from './api/api';

import type { QueryParams } from './api/api';

/** ProEduc Intelligence: IA no atendimento do CRM (exige os módulos "crm" e "intelligence"). */
export class CrmAiService {
  private static readonly BASE_PATH = '/crm/ai';

  // Configuração ------------------------------------------------------------

  static getSettings(): Promise<CrmAiSettings> {
    return ApiService.get<CrmAiSettings>(`${this.BASE_PATH}/settings`);
  }

  static updateSettings(payload: CrmAiSettingsPayload): Promise<CrmAiSettings> {
    return ApiService.put<CrmAiSettingsPayload, CrmAiSettings>(`${this.BASE_PATH}/settings`, payload);
  }

  // Histórico ---------------------------------------------------------------

  static listRuns(filters: CrmAiRunFilters): Promise<CrmAiRunList> {
    return ApiService.get<CrmAiRunList>(`${this.BASE_PATH}/runs`, filters as QueryParams);
  }

  // Base de conhecimento ----------------------------------------------------

  static listDocuments(search?: string): Promise<CrmAiKbDocument[]> {
    return ApiService.get<CrmAiKbDocument[]>(`${this.BASE_PATH}/kb/documents`, { search: search || undefined });
  }

  static getDocument(id: string): Promise<CrmAiKbDocumentDetail> {
    return ApiService.get<CrmAiKbDocumentDetail>(`${this.BASE_PATH}/kb/documents/${id}`);
  }

  static createDocument(payload: CrmAiKbCreatePayload): Promise<CrmAiKbDocument> {
    return ApiService.post<CrmAiKbCreatePayload, CrmAiKbDocument>(`${this.BASE_PATH}/kb/documents`, payload);
  }

  /** PDF ou TXT (até 10 MB). O título é opcional (padrão: nome do arquivo). */
  static uploadDocument(file: File, title?: string): Promise<CrmAiKbDocument> {
    const form = new FormData();
    form.append('file', file, file.name);
    if (title) form.append('title', title);
    return ApiService.post<FormData, CrmAiKbDocument>(`${this.BASE_PATH}/kb/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  static updateDocument(id: string, payload: CrmAiKbUpdatePayload): Promise<CrmAiKbDocument> {
    return ApiService.put<CrmAiKbUpdatePayload, CrmAiKbDocument>(`${this.BASE_PATH}/kb/documents/${id}`, payload);
  }

  static deleteDocument(id: string): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/kb/documents/${id}`);
  }

  static reindexDocument(id: string): Promise<CrmAiKbDocument> {
    return ApiService.post<object, CrmAiKbDocument>(`${this.BASE_PATH}/kb/documents/${id}/reindex`, {});
  }

  static search(q: string): Promise<CrmAiKbSearchResult[]> {
    return ApiService.get<CrmAiKbSearchResult[]>(`${this.BASE_PATH}/kb/search`, { q });
  }
}

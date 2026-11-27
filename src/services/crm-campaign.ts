import type {
  CrmReport,
  CrmCampaign,
  CrmWaTemplate,
  CrmReportFilters,
  CrmCampaignStatus,
  CrmCampaignOptions,
  CrmCampaignPayload,
  CrmAudiencePreview,
  CrmCampaignAudience,
  CrmCampaignRecipient,
  CrmCampaignVariableMapping,
} from 'src/types/services/crm-campaign';

import axiosInstance from 'src/utils/axios';

import { ApiService } from './api/api';

import type { QueryParams } from './api/api';

const BASE = '/crm';

/** Baixa um arquivo autenticado (mesmo axios do ApiService) e dispara o download no navegador. */
export async function downloadAuthenticated(url: string, params: QueryParams | undefined, fallbackName: string) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.append(k, String(v));
  });
  const query = search.toString();
  const response = await axiosInstance.get(`${url}${query ? `?${query}` : ''}`, { responseType: 'blob' });
  const disposition = String(response.headers?.['content-disposition'] ?? '');
  const name = /filename="?([^";]+)"?/i.exec(disposition)?.[1] || fallbackName;
  const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'text/csv' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  a.click();
  URL.revokeObjectURL(href);
}

export class CrmCampaignService {
  // Templates da Meta ------------------------------------------------------

  static listTemplates(params: { channelId?: string; status?: string } = {}): Promise<CrmWaTemplate[]> {
    return ApiService.get<CrmWaTemplate[]>(`${BASE}/templates`, params);
  }

  static syncTemplates(channelId: string): Promise<{ synced: number; removed: number; templates: CrmWaTemplate[] }> {
    return ApiService.post(`${BASE}/templates/sync`, { channelId });
  }

  // Campanhas --------------------------------------------------------------

  static options(): Promise<CrmCampaignOptions> {
    return ApiService.get<CrmCampaignOptions>(`${BASE}/campaigns/options`);
  }

  static list(status?: CrmCampaignStatus | ''): Promise<{ data: CrmCampaign[] }> {
    return ApiService.get(`${BASE}/campaigns`, { status: status || undefined });
  }

  static get(id: string): Promise<CrmCampaign> {
    return ApiService.get<CrmCampaign>(`${BASE}/campaigns/${id}`);
  }

  static previewAudience(payload: {
    channelId: string;
    templateId: string;
    variables: CrmCampaignVariableMapping;
    audience: CrmCampaignAudience;
  }): Promise<CrmAudiencePreview> {
    return ApiService.post(`${BASE}/campaigns/preview-audience`, payload);
  }

  static create(payload: CrmCampaignPayload): Promise<CrmCampaign> {
    return ApiService.post<CrmCampaignPayload, CrmCampaign>(`${BASE}/campaigns`, payload);
  }

  static remove(id: string): Promise<void> {
    return ApiService.delete<void>(`${BASE}/campaigns/${id}`);
  }

  static action(id: string, action: 'start' | 'pause' | 'resume' | 'cancel'): Promise<CrmCampaign> {
    return ApiService.post<object, CrmCampaign>(`${BASE}/campaigns/${id}/${action}`, {});
  }

  static recipients(
    id: string,
    params: { status?: string; page?: number; perPage?: number }
  ): Promise<{ data: CrmCampaignRecipient[]; total: number }> {
    return ApiService.get(`${BASE}/campaigns/${id}/recipients`, { ...params, status: params.status || undefined });
  }

  static downloadReport(id: string) {
    return downloadAuthenticated(`${BASE}/campaigns/${id}/report.csv`, undefined, `campanha-${id}.csv`);
  }

  // Relatórios -------------------------------------------------------------

  static report(filters: CrmReportFilters): Promise<CrmReport> {
    return ApiService.get<CrmReport>(`${BASE}/reports`, clean(filters));
  }

  static exportReport(filters: CrmReportFilters) {
    return downloadAuthenticated(`${BASE}/reports/export`, clean(filters), `chatflow-${filters.from}-a-${filters.to}.csv`);
  }
}

function clean(filters: CrmReportFilters): QueryParams {
  return {
    from: filters.from,
    to: filters.to,
    departmentId: filters.departmentId || undefined,
    userId: filters.userId || undefined,
    channelId: filters.channelId || undefined,
  };
}

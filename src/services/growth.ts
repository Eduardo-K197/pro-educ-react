import type {
  CrmTask,
  CrmDeal,
  CrmBoard,
  CrmPipeline,
  CrmDealList,
  CrmDealNote,
  GrowthOwner,
  GrowthCourse,
  CrmDealDetail,
  CrmStageInput,
  CrmDealFilters,
  CrmDealPayload,
  CrmTaskPayload,
  GrowthSettings,
  GrowthRecovery,
  CrmStudentOption,
  GrowthRetentionList,
} from 'src/types/services/crm-deal';

import { ApiService } from './api/api';

import type { QueryParams } from './api/api';

/** ProEduc Growth: funil comercial, recuperação, retenção e tarefas (/v1/growth). */
export class GrowthService {
  private static readonly BASE_PATH = '/growth';

  // Funis e leads -------------------------------------------------------

  static listPipelines(): Promise<CrmPipeline[]> {
    return ApiService.get<CrmPipeline[]>(`${this.BASE_PATH}/pipelines`);
  }

  static createPipeline(payload: { name: string; agentsSeeAll?: boolean; stages?: CrmStageInput[] }): Promise<CrmPipeline> {
    return ApiService.post<object, CrmPipeline>(`${this.BASE_PATH}/pipelines`, payload);
  }

  static updatePipeline(
    id: string,
    payload: { name?: string; agentsSeeAll?: boolean; isDefault?: boolean; stalledDays?: number; stages?: CrmStageInput[] }
  ): Promise<CrmPipeline> {
    return ApiService.put<object, CrmPipeline>(`${this.BASE_PATH}/pipelines/${id}`, payload);
  }

  static getBoard(params: { pipelineId?: string; owner?: string; source?: string; tagId?: string; search?: string } = {}): Promise<CrmBoard> {
    return ApiService.get<CrmBoard>(`${this.BASE_PATH}/deals/board`, params as QueryParams);
  }

  static listDeals(filters: CrmDealFilters): Promise<CrmDealList> {
    return ApiService.get<CrmDealList>(`${this.BASE_PATH}/deals`, filters as QueryParams);
  }

  static getDeal(id: string): Promise<CrmDealDetail> {
    return ApiService.get<CrmDealDetail>(`${this.BASE_PATH}/deals/${id}`);
  }

  static createDeal(payload: CrmDealPayload): Promise<CrmDeal> {
    return ApiService.post<CrmDealPayload, CrmDeal>(`${this.BASE_PATH}/deals`, payload);
  }

  static updateDeal(id: string, payload: CrmDealPayload): Promise<CrmDeal> {
    return ApiService.put<CrmDealPayload, CrmDeal>(`${this.BASE_PATH}/deals/${id}`, payload);
  }

  static moveDeal(id: string, stageId: string, lostReason?: string | null): Promise<CrmDeal> {
    return ApiService.post<object, CrmDeal>(`${this.BASE_PATH}/deals/${id}/move`, { stageId, lostReason: lostReason ?? null });
  }

  static assignDeal(id: string, owner: { userType: string; userId: string } | null): Promise<CrmDeal> {
    return ApiService.post<object, CrmDeal>(`${this.BASE_PATH}/deals/${id}/assign`, { owner });
  }

  static convertDeal(id: string, studentId: number): Promise<CrmDeal> {
    return ApiService.post<object, CrmDeal>(`${this.BASE_PATH}/deals/${id}/convert`, { studentId });
  }

  static deleteDeal(id: string): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/deals/${id}`);
  }

  static addDealNote(id: string, body: string): Promise<CrmDealNote> {
    return ApiService.post<object, CrmDealNote>(`${this.BASE_PATH}/deals/${id}/notes`, { body });
  }

  static deleteDealNote(id: string, noteId: string): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/deals/${id}/notes/${noteId}`);
  }

  static searchStudentsForDeal(search: string): Promise<CrmStudentOption[]> {
    return ApiService.get<CrmStudentOption[]>(`${this.BASE_PATH}/deals/student-search`, { search });
  }

  static conversationDeals(conversationId: string): Promise<CrmDeal[]> {
    return ApiService.get<CrmDeal[]>(`/crm/conversations/${conversationId}/deals`);
  }

  static openConversationDeal(conversationId: string, dealId?: string | null): Promise<{ created: boolean; deal: CrmDeal }> {
    return ApiService.post<object, { created: boolean; deal: CrmDeal }>(`/crm/conversations/${conversationId}/deal`, { dealId: dealId ?? null });
  }

  // Tarefas -------------------------------------------------------------

  static listTasks(params: { scope?: 'mine' | 'all'; status?: string; dealId?: string; due?: string } = {}): Promise<CrmTask[]> {
    return ApiService.get<CrmTask[]>(`${this.BASE_PATH}/tasks`, params as QueryParams);
  }

  static createTask(payload: CrmTaskPayload): Promise<CrmTask> {
    return ApiService.post<CrmTaskPayload, CrmTask>(`${this.BASE_PATH}/tasks`, payload);
  }

  static updateTask(id: string, payload: CrmTaskPayload): Promise<CrmTask> {
    return ApiService.put<CrmTaskPayload, CrmTask>(`${this.BASE_PATH}/tasks/${id}`, payload);
  }

  static deleteTask(id: string): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/tasks/${id}`);
  }

  // Apoio dos formulários -----------------------------------------------

  /** Membros ativos do CRM + admins da escola (gestores implícitos). */
  static listOwners(): Promise<GrowthOwner[]> {
    return ApiService.get<GrowthOwner[]>(`${this.BASE_PATH}/owners`);
  }

  static listCourses(): Promise<GrowthCourse[]> {
    return ApiService.get<GrowthCourse[]>(`${this.BASE_PATH}/courses`);
  }

  // Recuperação, retenção e configurações --------------------------------

  static getSettings(): Promise<GrowthSettings> {
    return ApiService.get<GrowthSettings>(`${this.BASE_PATH}/settings`);
  }

  static updateSettings(payload: Partial<GrowthSettings>): Promise<GrowthSettings> {
    return ApiService.put<Partial<GrowthSettings>, GrowthSettings>(`${this.BASE_PATH}/settings`, payload);
  }

  static recovery(params: { type: 'stalled' | 'lost'; days?: number; search?: string; owner?: string; page?: number; perPage?: number }): Promise<GrowthRecovery> {
    return ApiService.get<GrowthRecovery>(`${this.BASE_PATH}/recovery`, params as QueryParams);
  }

  static reopenDeal(id: string, stageId?: string | null): Promise<CrmDeal> {
    return ApiService.post<object, CrmDeal>(`${this.BASE_PATH}/deals/${id}/reopen`, { stageId: stageId ?? null });
  }

  static retention(params: { reason?: string; search?: string } = {}): Promise<GrowthRetentionList> {
    return ApiService.get<GrowthRetentionList>(`${this.BASE_PATH}/retention`, params as QueryParams);
  }
}

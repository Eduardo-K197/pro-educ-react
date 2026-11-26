import type {
  CrmMe,
  CrmMember,
  CrmCandidate,
  CrmDepartment,
  CrmDepartmentPayload,
  CrmMemberCreatePayload,
  CrmMemberUpdatePayload,
} from 'src/types/services/crm';

import { ApiService } from './api/api';

export class CrmService {
  private static readonly BASE_PATH = '/crm';

  static me(): Promise<CrmMe> {
    return ApiService.get<CrmMe>(`${this.BASE_PATH}/me`);
  }

  // Setores -------------------------------------------------------------

  static listDepartments(): Promise<CrmDepartment[]> {
    return ApiService.get<CrmDepartment[]>(`${this.BASE_PATH}/departments`);
  }

  static createDepartment(payload: CrmDepartmentPayload): Promise<CrmDepartment> {
    return ApiService.post<CrmDepartmentPayload, CrmDepartment>(
      `${this.BASE_PATH}/departments`,
      payload
    );
  }

  static updateDepartment(id: string, payload: CrmDepartmentPayload): Promise<CrmDepartment> {
    return ApiService.put<CrmDepartmentPayload, CrmDepartment>(
      `${this.BASE_PATH}/departments/${id}`,
      payload
    );
  }

  static deleteDepartment(id: string): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/departments/${id}`);
  }

  // Membros -------------------------------------------------------------

  static listMembers(): Promise<CrmMember[]> {
    return ApiService.get<CrmMember[]>(`${this.BASE_PATH}/members`);
  }

  static listCandidates(): Promise<CrmCandidate[]> {
    return ApiService.get<CrmCandidate[]>(`${this.BASE_PATH}/members/candidates`);
  }

  static createMember(payload: CrmMemberCreatePayload): Promise<CrmMember> {
    return ApiService.post<CrmMemberCreatePayload, CrmMember>(`${this.BASE_PATH}/members`, payload);
  }

  static updateMember(id: string, payload: CrmMemberUpdatePayload): Promise<CrmMember> {
    return ApiService.put<CrmMemberUpdatePayload, CrmMember>(
      `${this.BASE_PATH}/members/${id}`,
      payload
    );
  }

  static deleteMember(id: string): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/members/${id}`);
  }
}

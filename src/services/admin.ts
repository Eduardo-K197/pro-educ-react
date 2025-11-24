import type { AxiosRequestConfig } from 'axios';
import { ApiService } from './api/api';
import type {
  AdminDetail,
  AdminCreatePayload,
  AdminUpdatePayload,
  AdminsIndexResponse,
} from 'src/types/services/admin';

export class AdminService {
  private static readonly BASE_PATH = '/admins';

  static list(config?: AxiosRequestConfig): Promise<AdminsIndexResponse> {
    return ApiService.get<AdminsIndexResponse>(this.BASE_PATH, undefined, config);
  }

  static detail(id: string, config?: AxiosRequestConfig): Promise<AdminDetail> {
    return ApiService.get<AdminDetail>(`${this.BASE_PATH}/${id}`, undefined, config);
  }

  static create(body: AdminCreatePayload, config?: AxiosRequestConfig): Promise<AdminDetail> {
    return ApiService.post<AdminCreatePayload, AdminDetail>(this.BASE_PATH, body, config);
  }

  static update(
    id: string,
    body: AdminUpdatePayload,
    config?: AxiosRequestConfig
  ): Promise<AdminDetail> {
    return ApiService.put<AdminUpdatePayload, AdminDetail>(
      `${this.BASE_PATH}/${id}`,
      body,
      config
    );
  }

  static delete(id: string, config?: AxiosRequestConfig): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/${id}`, config);
  }
}

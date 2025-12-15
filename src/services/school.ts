import type { AxiosRequestConfig } from 'axios';
import type {
  SchoolDetail,
  SchoolCreatePayload,
  SchoolUpdatePayload,
  SchoolsIndexResponse,
} from 'src/types/services/school';

import { ApiService, type QueryParams } from './api/api';

export class SchoolService {
  private static readonly BASE_PATH = '/schools';

  static list(params?: QueryParams, config?: AxiosRequestConfig): Promise<SchoolsIndexResponse> {
    return ApiService.get<SchoolsIndexResponse>(this.BASE_PATH, params, config);
  }

  static getById(id: string, config?: AxiosRequestConfig): Promise<SchoolDetail> {
    return ApiService.get<SchoolDetail>(`${this.BASE_PATH}/${id}`, undefined, config);
  }

  static create(payload: SchoolCreatePayload, config?: AxiosRequestConfig): Promise<SchoolDetail> {
    return ApiService.post<SchoolCreatePayload, SchoolDetail>(this.BASE_PATH, payload, config);
  }

  static update(
    id: string,
    payload: SchoolUpdatePayload,
    config?: AxiosRequestConfig
  ): Promise<SchoolDetail> {
    return ApiService.put<SchoolUpdatePayload, SchoolDetail>(
      `${this.BASE_PATH}/${id}`,
      payload,
      config
    );
  }

  static delete(id: string, config?: AxiosRequestConfig): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/${id}`, config);
  }

  static recover(id: string, config?: AxiosRequestConfig): Promise<void> {
    return ApiService.put<Record<string, never>, void>(
      `${this.BASE_PATH}/${id}/recover`,
      {},
      config
    );
  }
}

import type { AxiosRequestConfig } from 'axios';

import type {
  StudentDetail,
  StudentCreatePayload,
  StudentUpdatePayload,
  StudentsIndexResponse,
} from 'src/types/services/student';

import { ApiService, type QueryParams } from './api/api';

export class StudentService {
  private static readonly BASE_PATH = '/students';

  static list(params?: QueryParams, config?: AxiosRequestConfig): Promise<StudentsIndexResponse> {
    return ApiService.get<StudentsIndexResponse>(this.BASE_PATH, params, config);
  }

  static getById(id: number | string, config?: AxiosRequestConfig): Promise<StudentDetail> {
    return ApiService.get<StudentDetail>(`${this.BASE_PATH}/${id}`, undefined, config);
  }

  static create(payload: StudentCreatePayload, config?: AxiosRequestConfig): Promise<StudentDetail> {
    return ApiService.post<StudentCreatePayload, StudentDetail>(this.BASE_PATH, payload, config);
  }

  static update(
    id: number | string,
    payload: StudentUpdatePayload,
    config?: AxiosRequestConfig
  ): Promise<StudentDetail> {
    return ApiService.put<StudentUpdatePayload, StudentDetail>(
      `${this.BASE_PATH}/${id}`,
      payload,
      config
    );
  }

  static delete(id: number | string, config?: AxiosRequestConfig): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/${id}`, config);
  }

  static getReport(id: number | string, config?: AxiosRequestConfig): Promise<Blob> {
    return ApiService.get<Blob>(`${this.BASE_PATH}/${id}/report`, undefined, {
      ...config,
      responseType: 'blob',
    });
  }
}

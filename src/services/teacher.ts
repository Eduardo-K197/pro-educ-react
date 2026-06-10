import type { AxiosRequestConfig } from 'axios';

import type {
  TeacherDetail,
  TeacherCreatePayload,
  TeacherUpdatePayload,
  TeachersIndexResponse,
} from 'src/types/services/teacher';

import { ApiService, type QueryParams } from './api/api';

export class TeacherService {
  private static readonly BASE_PATH = '/teachers';

  static list(params?: QueryParams, config?: AxiosRequestConfig): Promise<TeachersIndexResponse> {
    return ApiService.get<TeachersIndexResponse>(this.BASE_PATH, params, config);
  }

  static getById(id: string, config?: AxiosRequestConfig): Promise<TeacherDetail> {
    return ApiService.get<TeacherDetail>(`${this.BASE_PATH}/${id}`, undefined, config);
  }

  static create(
    payload: TeacherCreatePayload,
    config?: AxiosRequestConfig
  ): Promise<TeacherDetail> {
    return ApiService.post<TeacherCreatePayload, TeacherDetail>(this.BASE_PATH, payload, config);
  }

  static update(
    id: string,
    payload: TeacherUpdatePayload,
    config?: AxiosRequestConfig
  ): Promise<TeacherDetail> {
    return ApiService.put<TeacherUpdatePayload, TeacherDetail>(
      `${this.BASE_PATH}/${id}`,
      payload,
      config
    );
  }

  static delete(id: string, config?: AxiosRequestConfig): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/${id}`, config);
  }
}

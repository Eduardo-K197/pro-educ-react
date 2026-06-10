import type { AxiosRequestConfig } from 'axios';

import type {
  LessonDetail,
  LessonCreatePayload,
  LessonUpdatePayload,
  LessonsIndexResponse,
} from 'src/types/services/lesson';

import { ApiService, type QueryParams } from './api/api';

export class LessonService {
  private static readonly BASE_PATH = '/classes';

  static list(params?: QueryParams, config?: AxiosRequestConfig): Promise<LessonsIndexResponse> {
    return ApiService.get<LessonsIndexResponse>(this.BASE_PATH, params, config);
  }

  static getById(id: string, config?: AxiosRequestConfig): Promise<LessonDetail> {
    return ApiService.get<LessonDetail>(`${this.BASE_PATH}/${id}`, undefined, config);
  }

  static create(payload: LessonCreatePayload, config?: AxiosRequestConfig): Promise<LessonDetail> {
    return ApiService.post<LessonCreatePayload, LessonDetail>(this.BASE_PATH, payload, config);
  }

  static update(
    id: string,
    payload: LessonUpdatePayload,
    config?: AxiosRequestConfig
  ): Promise<LessonDetail> {
    return ApiService.put<LessonUpdatePayload, LessonDetail>(
      `${this.BASE_PATH}/${id}`,
      payload,
      config
    );
  }

  static delete(id: string, config?: AxiosRequestConfig): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/${id}`, config);
  }
}

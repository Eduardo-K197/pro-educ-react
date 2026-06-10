import type { AxiosRequestConfig } from 'axios';

import type {
  CourseDetail,
  CourseCreatePayload,
  CourseUpdatePayload,
  CoursesIndexResponse,
} from 'src/types/services/course';

import { ApiService, type QueryParams } from './api/api';

export class CourseService {
  private static readonly BASE_PATH = '/courses';

  static list(params?: QueryParams, config?: AxiosRequestConfig): Promise<CoursesIndexResponse> {
    return ApiService.get<CoursesIndexResponse>(this.BASE_PATH, params, config);
  }

  static getById(id: string, config?: AxiosRequestConfig): Promise<CourseDetail> {
    return ApiService.get<CourseDetail>(`${this.BASE_PATH}/${id}`, undefined, config);
  }

  static create(payload: CourseCreatePayload, config?: AxiosRequestConfig): Promise<CourseDetail> {
    return ApiService.post<CourseCreatePayload, CourseDetail>(this.BASE_PATH, payload, config);
  }

  static update(
    id: string,
    payload: CourseUpdatePayload,
    config?: AxiosRequestConfig
  ): Promise<CourseDetail> {
    return ApiService.put<CourseUpdatePayload, CourseDetail>(
      `${this.BASE_PATH}/${id}`,
      payload,
      config
    );
  }

  static delete(id: string, config?: AxiosRequestConfig): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/${id}`, config);
  }
}

import type { AxiosRequestConfig } from 'axios';

import type {
  ClassroomDetail,
  ClassroomCreatePayload,
  ClassroomUpdatePayload,
  ClassroomsIndexResponse,
} from 'src/types/services/classroom';

import { ApiService, type QueryParams } from './api/api';

export class ClassroomService {
  private static readonly BASE_PATH = '/classrooms';

  static list(
    params?: QueryParams,
    config?: AxiosRequestConfig
  ): Promise<ClassroomsIndexResponse> {
    return ApiService.get<ClassroomsIndexResponse>(this.BASE_PATH, params, config);
  }

  static getById(id: string, config?: AxiosRequestConfig): Promise<ClassroomDetail> {
    return ApiService.get<ClassroomDetail>(`${this.BASE_PATH}/${id}`, undefined, config);
  }

  static create(
    payload: ClassroomCreatePayload,
    config?: AxiosRequestConfig
  ): Promise<ClassroomDetail> {
    return ApiService.post<ClassroomCreatePayload, ClassroomDetail>(
      this.BASE_PATH,
      payload,
      config
    );
  }

  static update(
    id: string,
    payload: ClassroomUpdatePayload,
    config?: AxiosRequestConfig
  ): Promise<ClassroomDetail> {
    return ApiService.put<ClassroomUpdatePayload, ClassroomDetail>(
      `${this.BASE_PATH}/${id}`,
      payload,
      config
    );
  }

  static delete(id: string, config?: AxiosRequestConfig): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/${id}`, config);
  }
}

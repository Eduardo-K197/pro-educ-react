import type { AxiosRequestConfig } from 'axios';

import { ApiService, type QueryParams } from './api/api';

export interface SubscriptionMaterial {
  id?: string;
  materialId: string;
  receivedAt: string;
}

export interface SubscriptionPresence {
  id: string;
  status?: string;
  createdAt?: string;
  class?: {
    id: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
    details?: string;
    teacher?: { id: string; name: string };
  };
}

export interface SubscriptionDetail {
  id: string;
  studentId?: number;
  classroomId?: string;
  startAt?: string;
  endAt?: string;
  deletedAt?: string | null;
  classroom?: {
    id: string;
    name: string;
    course?: {
      id: string;
      name: string;
      materials?: { id: string; name: string }[];
    };
  };
  receivedMaterials?: SubscriptionMaterial[];
  presences?: SubscriptionPresence[];
  certificate?: { id: string; status?: string; url?: string } | null;
}

export interface SubscriptionCreatePayload {
  studentId: number;
  classroomId: string;
  startAt?: string;
  endAt?: string;
  receivedMaterials?: { materialId: string; receivedAt: string }[];
}

export interface SubscriptionUpdatePayload {
  startAt?: string;
  endAt?: string;
  receivedMaterials?: { materialId: string; receivedAt: string }[];
}

export interface SubscriptionsResponse {
  subscriptions: SubscriptionDetail[];
  count?: number;
}

export class SubscriptionService {
  private static readonly BASE_PATH = '/subscriptions';

  static list(
    params?: QueryParams,
    config?: AxiosRequestConfig
  ): Promise<SubscriptionsResponse> {
    return ApiService.get<SubscriptionsResponse>(this.BASE_PATH, params, config);
  }

  static getById(id: string, config?: AxiosRequestConfig): Promise<SubscriptionDetail> {
    return ApiService.get<SubscriptionDetail>(`${this.BASE_PATH}/${id}`, undefined, config);
  }

  static create(
    payload: SubscriptionCreatePayload,
    config?: AxiosRequestConfig
  ): Promise<SubscriptionDetail> {
    return ApiService.post<SubscriptionCreatePayload, SubscriptionDetail>(
      this.BASE_PATH,
      payload,
      config
    );
  }

  static update(
    id: string,
    payload: SubscriptionUpdatePayload,
    config?: AxiosRequestConfig
  ): Promise<SubscriptionDetail> {
    return ApiService.put<SubscriptionUpdatePayload, SubscriptionDetail>(
      `${this.BASE_PATH}/${id}`,
      payload,
      config
    );
  }

  static delete(id: string, config?: AxiosRequestConfig): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/${id}`, config);
  }
}

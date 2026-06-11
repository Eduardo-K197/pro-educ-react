import type { AxiosRequestConfig } from 'axios';

import { ApiService } from './api/api';

export type PresenceStatus = 'present' | 'absent' | 'justified';

export interface PresenceCreateItem {
  classId: string;
  subscriptionId: string;
  status: PresenceStatus;
}

export interface PresenceUpdateItem {
  id: string;
  status: PresenceStatus;
}

export class PresenceService {
  static create(
    presences: PresenceCreateItem[],
    config?: AxiosRequestConfig
  ): Promise<unknown[]> {
    return ApiService.post<{ presences: PresenceCreateItem[] }, unknown[]>(
      '/presences',
      { presences },
      config
    );
  }

  static update(
    presences: PresenceUpdateItem[],
    config?: AxiosRequestConfig
  ): Promise<unknown[]> {
    return ApiService.put<{ presences: PresenceUpdateItem[] }, unknown[]>(
      '/presences',
      { presences },
      config
    );
  }
}

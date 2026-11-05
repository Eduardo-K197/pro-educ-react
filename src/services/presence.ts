import type { AxiosRequestConfig } from 'axios';

import { ApiService } from './api/api';

export type PresenceStatus = 'present' | 'absent' | 'justified';

export interface PresenceRecord {id:string;classId:string;subscriptionId:string;status:PresenceStatus;createdAt?:string}

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
  ): Promise<PresenceRecord[]> {
    return ApiService.post<{ presences: PresenceCreateItem[] }, PresenceRecord[]>(
      '/presences',
      { presences },
      config
    );
  }

  static update(
    presences: PresenceUpdateItem[],
    config?: AxiosRequestConfig
  ): Promise<PresenceRecord[]> {
    return ApiService.put<{ presences: PresenceUpdateItem[] }, PresenceRecord[]>(
      '/presences',
      { presences },
      config
    );
  }
}

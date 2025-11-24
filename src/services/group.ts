import type { AxiosRequestConfig } from 'axios';
import type { IGroupItem } from 'src/types/group';

import { ApiService } from 'src/services/api/api';

export class GroupService {
  private static readonly BASE_PATH = '/group';

  static async getAll(): Promise<IGroupItem[]> {
    return ApiService.get<IGroupItem[]>(this.BASE_PATH);
  }

  static async getById(id: string): Promise<IGroupItem> {
    return ApiService.get<IGroupItem>(`${this.BASE_PATH}/${id}`);
  }

  static async create(
    payload: Omit<IGroupItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<IGroupItem> {
    return ApiService.post<typeof payload, IGroupItem>(this.BASE_PATH, payload);
  }

  static async update(id: string, payload: Partial<IGroupItem>): Promise<IGroupItem> {
    return ApiService.put<typeof payload, IGroupItem>(`${this.BASE_PATH}/${id}`, payload);
  }

  static async delete(id: string): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/${id}`);
  }

  // Mantém a rota usada no erro, agora usando o 3º parâmetro como config
  static async listPagination(config?: AxiosRequestConfig): Promise<IGroupItem[]> {
    return ApiService.get<IGroupItem[]>(
      `${this.BASE_PATH}?hasPagination=false`,
      undefined, // params
      config // config
    );
  }
}

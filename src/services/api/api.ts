import type { AxiosRequestConfig } from 'axios';

import axiosInstance from 'src/utils/axios';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export class ApiService {
  private static buildQueryString(params?: QueryParams): string {
    if (!params) return '';
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }

  static async get<T>(
    url: string,
    params?: QueryParams,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const query = this.buildQueryString(params);
    const { data } = await axiosInstance.get<T>(`${url}${query}`, config);
    return data;
  }

  static async post<TRequest, TResponse = TRequest>(
    url: string,
    body: TRequest,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const { data } = await axiosInstance.post<TResponse>(url, body, config);
    return data;
  }

  static async put<TRequest, TResponse = TRequest>(
    url: string,
    body: TRequest,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const { data } = await axiosInstance.put<TResponse>(url, body, config);
    return data;
  }

  static async delete<TResponse = void>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const { data } = await axiosInstance.delete<TResponse>(url, config);
    return data;
  }

  static async patch<TRequest, TResponse = TRequest>(
    url: string,
    body: TRequest,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const { data } = await axiosInstance.patch<TResponse>(url, body, config);
    return data;
  }

}

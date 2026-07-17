import type { AxiosRequestConfig } from 'axios';

import type {
  EntryDetail,
  EntryCreatePayload,
  EntryUpdatePayload,
  EntriesIndexResponse,
  EntryCategory,
} from 'src/types/services/entry';

import { ApiService, type QueryParams } from './api/api';

export class EntryService {
  private static readonly BASE_PATH = '/entries';
  private static readonly PAYMENT_PATH = '/payments';
  private static readonly CATEGORY_PATH = '/entry-categories';

  static listEntries(
    params?: QueryParams,
    config?: AxiosRequestConfig
  ): Promise<EntriesIndexResponse> {
    return ApiService.get<EntriesIndexResponse>(this.BASE_PATH, params, config);
  }

  static listPayments(
    params?: QueryParams,
    config?: AxiosRequestConfig
  ): Promise<EntriesIndexResponse> {
    return ApiService.get<EntriesIndexResponse>(this.PAYMENT_PATH, params, config);
  }

  static getEntryById(id: string, config?: AxiosRequestConfig): Promise<EntryDetail> {
    return ApiService.get<EntryDetail>(`${this.BASE_PATH}/${id}`, undefined, config);
  }

  static createEntry(
    payload: EntryCreatePayload,
    config?: AxiosRequestConfig
  ): Promise<EntryDetail> {
    return ApiService.post<EntryCreatePayload, EntryDetail>(this.BASE_PATH, payload, config);
  }

  static createPayment(
    payload: EntryCreatePayload,
    config?: AxiosRequestConfig
  ): Promise<EntryDetail> {
    return ApiService.post<EntryCreatePayload, EntryDetail>(this.PAYMENT_PATH, payload, config);
  }

  static updateEntry(
    id: string,
    payload: EntryUpdatePayload,
    config?: AxiosRequestConfig
  ): Promise<EntryDetail> {
    return ApiService.put<EntryUpdatePayload, EntryDetail>(
      `${this.BASE_PATH}/${id}`,
      payload,
      config
    );
  }

  static updatePayment(
    id: string,
    payload: EntryUpdatePayload,
    config?: AxiosRequestConfig
  ): Promise<EntryDetail> {
    return ApiService.put<EntryUpdatePayload, EntryDetail>(
      `${this.PAYMENT_PATH}/${id}`,
      payload,
      config
    );
  }

  static deleteEntry(id: string, config?: AxiosRequestConfig): Promise<void> {
    return ApiService.delete<void>(`${this.BASE_PATH}/${id}`, config);
  }

  static deletePayment(id: string, config?: AxiosRequestConfig): Promise<void> {
    return ApiService.delete<void>(`${this.PAYMENT_PATH}/${id}`, config);
  }

  static deleteInstallment(id: string, config?: AxiosRequestConfig): Promise<void> {
    return ApiService.delete<void>(`/installments/${id}`, config);
  }

  static getInstallmentPdf(id: string, config?: AxiosRequestConfig): Promise<{ pdfBase64: string }> {
    return ApiService.get<{ pdfBase64: string }>(`/installments/${id}`, undefined, config);
  }

  static recoverEntry(id: string, config?: AxiosRequestConfig): Promise<void> {
    return ApiService.patch<Record<string, never>, void>(
      `${this.BASE_PATH}/${id}/recover`,
      {},
      config
    );
  }

  static listCategories(config?: AxiosRequestConfig): Promise<{ categories: EntryCategory[] }> {
    return ApiService.get<{ categories: EntryCategory[] }>(this.CATEGORY_PATH, undefined, config);
  }

  static createCategory(
    payload: { name: string },
    config?: AxiosRequestConfig
  ): Promise<EntryCategory> {
    return ApiService.post<{ name: string }, EntryCategory>(
      this.CATEGORY_PATH,
      payload,
      config
    );
  }

  static deleteCategory(id: string, config?: AxiosRequestConfig): Promise<void> {
    return ApiService.delete<void>(`${this.CATEGORY_PATH}/${id}`, config);
  }
}

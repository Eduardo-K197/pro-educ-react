import axios, { type AxiosError } from 'axios';

import axiosInstance from 'src/utils/axios';

export type ExportResource =
  | 'students'
  | 'financial'
  | 'courses'
  | 'classrooms'
  | 'teachers'
  | 'lessons';
export type ExportColumn = {
  id: string;
  label: string;
  group: string;
  type?: 'text' | 'date' | 'number' | 'money';
  default?: boolean;
  width?: number;
};
export type ExportDefinition = {
  title: string;
  filename: string;
  columns: ExportColumn[];
  dates: { id: string; label: string }[];
  statuses?: { value: string; label: string }[];
  limit: number;
};
export type ExportFilters = {
  search?: string;
  status?: string;
  dateField?: string;
  from?: string;
  to?: string;
};
export type ExportInput = ExportFilters & { columns: string[]; includeSummary: boolean };
export type ExportPreview = {
  count: number;
  rows: Record<string, unknown>[];
  limit: number;
  canExport: boolean;
};
export const ExportService = {
  async options(resource: ExportResource, signal: AbortSignal) {
    const { data } = await axiosInstance.get<ExportDefinition>(`/exports/${resource}/options`, {
      signal,
    });
    return data;
  },
  async preview(resource: ExportResource, input: ExportInput, signal: AbortSignal) {
    const { data } = await axiosInstance.post<ExportPreview>(
      `/exports/${resource}/preview`,
      input,
      { signal }
    );
    return data;
  },
  async download(resource: ExportResource, input: ExportInput, signal: AbortSignal) {
    const response = await axiosInstance.post<Blob>(`/exports/${resource}/download`, input, {
      signal,
      responseType: 'blob',
    });
    if (!response.data.type.includes('spreadsheetml') || response.data.size < 4)
      throw new Error('Não foi possível gerar uma planilha válida. Tente novamente.');
    const signature = new Uint8Array(await response.data.slice(0, 2).arrayBuffer());
    if (signature[0] !== 80 || signature[1] !== 75)
      throw new Error('O arquivo recebido não é uma planilha Excel válida.');
    return response.data;
  },
};
export async function exportError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const { response } = error as AxiosError;
    let data: any = response?.data;
    if (data instanceof Blob) {
      try {
        data = JSON.parse(await data.text());
      } catch {
        data = null;
      }
    }
    if (response?.status === 404)
      return 'A exportação está indisponível no momento. Tente novamente mais tarde.';
    if (data?.message && typeof data.message === 'string') return data.message;
  }
  return error instanceof Error && !axios.isAxiosError(error)
    ? error.message
    : 'Não foi possível consultar a exportação. Confira sua conexão e tente novamente.';
}

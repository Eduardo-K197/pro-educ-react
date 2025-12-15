import type { IDatePickerControl } from 'src/types/common';

export interface IAdminTableFilters {
  name: string;
  startDate: IDatePickerControl | null;
  endDate: IDatePickerControl | null;
  // campos opcionais úteis para paginação/ordenacao
  page?: number;
  pageSize?: number;
  sortBy?: string;
}

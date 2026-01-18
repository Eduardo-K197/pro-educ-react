import type { IDatePickerControl } from '../common';

export interface AdminListItem {
  id: string;
  name: string;
  email: string;
  status?: string;
  createdAt: string;
}

export type IAdminTableFilters = {
  name: string;
  status: string;
  startDate: IDatePickerControl;
  endDate: IDatePickerControl;
};

// detalhe (ajusta com o que o backend devolve)
export interface AdminDetail extends AdminListItem {
  groups: { id: string; name: string }[];
}

export interface AdminCreatePayload {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  groups: string[];
}

export interface AdminUpdatePayload {
  name?: string;
  email?: string;
  password?: string;
  passwordConfirmation?: string;
  groups?: string[];
}

export interface AdminsIndexResponse {
  admins: AdminListItem[];
}

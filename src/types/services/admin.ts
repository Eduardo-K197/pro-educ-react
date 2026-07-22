import type { IDatePickerControl } from '../common';

export interface AdminListItem {
  id: string;
  name: string;
  email: string;
  status?: string;
  role?: string;
  createdAt?: string;
  schools?: { id: string; name: string }[];
}

export type IAdminTableFilters = {
  name: string;
  role: string;
  startDate: IDatePickerControl;
  endDate: IDatePickerControl;
};

// detalhe (ajusta com o que o backend devolve)
export interface AdminDetail extends AdminListItem {
  groups: { id: string; name: string }[];
  avatarUrl?: string;
}

export interface AdminCreatePayload {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  groups: string[];
  schools?: string[];
}

export interface AdminUpdatePayload {
  name?: string;
  email?: string;
  password?: string;
  passwordConfirmation?: string;
  groups?: string[];
  schools?: string[];
}

export interface AdminsIndexResponse {
  admins: AdminListItem[];
}

export type IAdminItem = {
  id: string;
  name: string;
  email: string;
  status?: string;
  role?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  // Pode ser apenas uma lista de ids (string[]) ou array de objetos {id,name}
  schools?: string[] | { id: string; name: string }[];
};

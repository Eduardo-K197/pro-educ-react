// ================================
// GROUP – UI FILTERS (FRONT ONLY)
// ================================
export type IGroupUiFilters = {
  name: string;
  tags: string[];
  locations: string[];
  visibility: 'all' | 'public' | 'private';
  minMembers: number | null;
};

export const defaultGroupUiFilters: IGroupUiFilters = {
  name: '',
  tags: [],
  locations: [],
  visibility: 'all',
  minMembers: null,
};

// ================================
// GROUP – TABLE FILTERS (LISTAGEM)
// ================================
export type IGroupTableFilters = {
  name: string;
  status: string;
  startDate: Date | string | number;
  endDate: Date | string | number;
  tags: string[];
  locations: string[];
  visibility: 'all' | 'public' | 'private';
  minMembers: number | null;
  maxMembers: number | null;
};

// ================================
// GROUP – ENTITY (BACKEND)
// ================================
export type IGroupItem = {
  id: string;
  name: string;
  groupAdmin: GroupAdminRelation[];
  groupSchool: GroupSchoolRelation[];
  active?: string;
};

export interface GroupAdminRelation {
  id: string;
  admin: {
    id: string;
    name: string;
  };
}

export interface GroupSchoolRelation {
  id: string;
  school: {
    id: string;
    name: string;
  };
}

// ================================
// GROUP – PAYLOADS (CREATE / UPDATE)
// ================================
export interface IGroupCreatePayload {
  name: string;
  description: string;
  tags: string[];
  locations: string[];
  visibility: 'public' | 'private';
  totalMembers: number;
}

export interface IGroupUpdatePayload {
  name?: string;
  description?: string;
  tags?: string[];
  locations?: string[];
  visibility?: 'public' | 'private';
  totalMembers?: number;
}

// ================================
// SORT
// ================================
export interface IGroupSortOption {
  value: string;
  label: string;
}

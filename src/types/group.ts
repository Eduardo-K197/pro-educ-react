// export interface IGroupItem {
//   id: string;
//   name: string;
//   description: string;
//   tags: string[];
//   locations: string[];
//   visibility: 'public' | 'private';
//   totalMembers: number;
//   createdAt: Date;
// }
//
// export interface IGroupFilters {
//   tags: string[];
//   locations: string[];
//   visibility: 'all' | 'public' | 'private';
//   minMembers: number | null;
// }

export interface IGroupSortOption {
  value: string;
  label: string;
}

// payloads para CRUD
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

export type IGroupFilters = {
  name: string;
  status: string;
};

export type IGroupItem = {
  id: string;
  name: string;
  groupAdmin: GroupAdminRelation[];
  groupSchool: GroupSchoolRelation[];
  active?: string | string;
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
  totalMembers: number | null;
  totalGroups: number | null;
  totalUsers: number | null;
  totalPosts: number | null;
  totalComments: number | null;
  totalLikes: number | null;
  totalShares: number | null;
  totalViews: number | null;
  totalDownloads: number | null;
};

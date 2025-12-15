export type Visibility = 'public' | 'private';

export interface IGroupItem {
  id: string;
  name: string;
  locations?: string[];
  visibility: Visibility;
  totalMembers: number;
  createdAt: Date;
}

export type IGroupFilters = {
  name?: string;

  tags: string[];
  locations: string[];

  visibility: 'all' | 'public' | 'private';
  minMembers?: number;
};

export interface IGroupSortOption {
  value: string;
  label: string;
}

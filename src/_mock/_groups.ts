import type { IGroupItem, IGroupSortOption } from 'src/types/group';

export const _groups: IGroupItem[] = [
  {
    id: 'grp_1',
    name: 'Frontend Masters',
    description: 'Discussão sobre React, Vue e ferramentas UI.',
    tags: ['frontend', 'react', 'ui'],
    locations: ['Remote', 'São Paulo'],
    visibility: 'public',
    totalMembers: 320,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
  {
    id: 'grp_2',
    name: 'Data Engineers Hub',
    description: 'Pipelines, lakes e arquitetura de dados.',
    tags: ['data', 'etl', 'cloud'],
    locations: ['Remote'],
    visibility: 'private',
    totalMembers: 85,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
  },
  {
    id: 'grp_3',
    name: 'Mobile Squad',
    description: 'iOS, Android e React Native.',
    tags: ['mobile', 'ios', 'android'],
    locations: ['Rio de Janeiro', 'Remote'],
    visibility: 'public',
    totalMembers: 150,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
];

export const GROUP_SORT_OPTIONS: IGroupSortOption[] = [
  { value: 'latest', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigos' },
  { value: 'popular', label: 'Mais populares' },
];

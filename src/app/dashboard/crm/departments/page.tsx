import type { Metadata } from 'next';

import { CrmDepartmentListView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM - Setores' };

export default function Page() {
  return <CrmDepartmentListView />;
}

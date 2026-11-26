import type { Metadata } from 'next';

import { CrmMemberListView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM - Membros' };

export default function Page() {
  return <CrmMemberListView />;
}

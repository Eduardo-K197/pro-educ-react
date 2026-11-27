import type { Metadata } from 'next';

import { CrmLeadListView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM - Leads' };

export default function Page() {
  return <CrmLeadListView />;
}

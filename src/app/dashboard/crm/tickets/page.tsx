import type { Metadata } from 'next';

import { CrmTicketListView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM - Chamados' };

export default function Page() {
  return <CrmTicketListView />;
}

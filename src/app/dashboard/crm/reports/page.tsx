import type { Metadata } from 'next';

import { CrmReportView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM - Relatórios' };

export default function Page() {
  return <CrmReportView />;
}

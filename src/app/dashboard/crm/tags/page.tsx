import type { Metadata } from 'next';

import { CrmTagListView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM - Tags' };

export default function Page() {
  return <CrmTagListView />;
}

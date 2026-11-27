import type { Metadata } from 'next';

import { CrmTemplateListView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM - Templates' };

export default function Page() {
  return <CrmTemplateListView />;
}

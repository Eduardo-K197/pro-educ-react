import type { Metadata } from 'next';

import { CrmOverviewView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM' };

export default function Page() {
  return <CrmOverviewView />;
}

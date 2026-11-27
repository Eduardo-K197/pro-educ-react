import type { Metadata } from 'next';

import { CrmFunnelView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM - Funil' };

export default function Page() {
  return <CrmFunnelView />;
}

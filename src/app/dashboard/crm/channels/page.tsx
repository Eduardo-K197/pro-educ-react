import type { Metadata } from 'next';

import { CrmChannelListView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM - Canais' };

export default function Page() {
  return <CrmChannelListView />;
}

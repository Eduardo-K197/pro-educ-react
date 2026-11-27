import type { Metadata } from 'next';

import { GrowthLeadListView } from 'src/sections/growth/view';

export const metadata: Metadata = { title: 'Growth - Leads' };

export default function Page() {
  return <GrowthLeadListView />;
}

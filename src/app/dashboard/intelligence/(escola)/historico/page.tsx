import type { Metadata } from 'next';

import { IntelligenceRunListView } from 'src/sections/intelligence/view';

export const metadata: Metadata = { title: 'Intelligence - Histórico' };

export default function Page() {
  return <IntelligenceRunListView />;
}

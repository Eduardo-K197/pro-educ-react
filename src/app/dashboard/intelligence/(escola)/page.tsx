import type { Metadata } from 'next';

import { IntelligenceOverviewView } from 'src/sections/intelligence/view';

export const metadata: Metadata = { title: 'ProEduc Intelligence' };

export default function Page() {
  return <IntelligenceOverviewView />;
}

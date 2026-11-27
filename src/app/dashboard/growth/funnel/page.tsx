import type { Metadata } from 'next';

import { GrowthFunnelView } from 'src/sections/growth/view';

export const metadata: Metadata = { title: 'Growth - Funil' };

export default function Page() {
  return <GrowthFunnelView />;
}

import type { Metadata } from 'next';

import { GrowthRetentionView } from 'src/sections/growth/view';

export const metadata: Metadata = { title: 'Growth - Retenção' };

export default function Page() {
  return <GrowthRetentionView />;
}

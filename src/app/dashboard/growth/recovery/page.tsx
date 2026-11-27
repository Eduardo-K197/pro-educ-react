import type { Metadata } from 'next';

import { GrowthRecoveryView } from 'src/sections/growth/view';

export const metadata: Metadata = { title: 'Growth - Recuperação' };

export default function Page() {
  return <GrowthRecoveryView />;
}

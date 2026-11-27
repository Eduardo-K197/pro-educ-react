import type { Metadata } from 'next';

import { GrowthSettingsView } from 'src/sections/growth/view';

export const metadata: Metadata = { title: 'Growth - Configurações' };

export default function Page() {
  return <GrowthSettingsView />;
}

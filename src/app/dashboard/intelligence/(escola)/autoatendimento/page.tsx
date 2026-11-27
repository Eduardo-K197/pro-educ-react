import type { Metadata } from 'next';

import { IntelligenceSettingsView } from 'src/sections/intelligence/view';

export const metadata: Metadata = { title: 'Intelligence - Autoatendimento' };

export default function Page() {
  return <IntelligenceSettingsView />;
}

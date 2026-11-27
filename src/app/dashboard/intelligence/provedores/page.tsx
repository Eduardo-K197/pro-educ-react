import type { Metadata } from 'next';

import { IntelligenceProvidersView } from 'src/sections/intelligence/view';

export const metadata: Metadata = { title: 'Provedores de IA' };

/** Fora do grupo (escola): tela global do super admin, sem o gate de módulos da escola. */
export default function Page() {
  return <IntelligenceProvidersView />;
}

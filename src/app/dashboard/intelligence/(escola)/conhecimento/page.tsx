import type { Metadata } from 'next';

import { IntelligenceKnowledgeView } from 'src/sections/intelligence/view';

export const metadata: Metadata = { title: 'Intelligence - Base de conhecimento' };

export default function Page() {
  return <IntelligenceKnowledgeView />;
}

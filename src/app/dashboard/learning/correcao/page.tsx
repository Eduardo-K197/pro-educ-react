import type { Metadata } from 'next';

import { LearningGradingQueueView } from 'src/sections/learning/view';

export const metadata: Metadata = { title: 'ProEduc Learning - Fila de correção' };

export default function Page() {
  return <LearningGradingQueueView />;
}

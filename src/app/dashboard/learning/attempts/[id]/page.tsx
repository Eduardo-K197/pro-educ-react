import type { Metadata } from 'next';

import { LearningAttemptView } from 'src/sections/learning/view';

export const metadata: Metadata = { title: 'ProEduc Learning - Correção' };

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <LearningAttemptView id={params.id} />;
}

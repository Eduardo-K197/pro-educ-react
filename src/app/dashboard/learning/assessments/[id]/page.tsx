import type { Metadata } from 'next';

import { LearningAssessmentView } from 'src/sections/learning/view';

export const metadata: Metadata = { title: 'ProEduc Learning - Avaliação' };

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <LearningAssessmentView id={params.id} />;
}

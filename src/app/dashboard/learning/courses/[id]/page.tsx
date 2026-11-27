import type { Metadata } from 'next';

import { LearningCourseView } from 'src/sections/learning/view';

export const metadata: Metadata = { title: 'ProEduc Learning - Curso' };

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <LearningCourseView id={params.id} />;
}

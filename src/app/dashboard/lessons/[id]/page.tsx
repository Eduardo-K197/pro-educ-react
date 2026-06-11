import type { Metadata } from 'next';

import { LessonDetailView } from 'src/sections/lesson/view';

export const metadata: Metadata = { title: 'Detalhes da aula' };

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <LessonDetailView id={params.id} />;
}

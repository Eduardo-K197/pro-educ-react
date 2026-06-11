import type { Metadata } from 'next';

import { CourseDetailsView } from 'src/sections/course/view';

export const metadata: Metadata = { title: 'Detalhes do curso' };

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <CourseDetailsView id={params.id} />;
}

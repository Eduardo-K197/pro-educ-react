import type { Metadata } from 'next';
import { CourseEditView } from 'src/sections/course/view';

export const metadata: Metadata = { title: 'Editar curso' };

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <CourseEditView id={params.id} />;
}

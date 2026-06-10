import type { Metadata } from 'next';
import { TeacherEditView } from 'src/sections/teacher/view';

export const metadata: Metadata = { title: 'Detalhes do professor' };

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <TeacherEditView id={params.id} />;
}

import type { Metadata } from 'next';
import { StudentEditView } from 'src/sections/student/view';

export const metadata: Metadata = { title: 'Editar aluno' };

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <StudentEditView id={params.id} />;
}

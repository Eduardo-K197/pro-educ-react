import type { Metadata } from 'next';
import { ClassroomEditView } from 'src/sections/classroom/view';

export const metadata: Metadata = { title: 'Editar turma' };

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <ClassroomEditView id={params.id} />;
}

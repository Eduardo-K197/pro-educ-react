import type { Metadata } from 'next';
import { StudentDetailsView } from 'src/sections/student/view';

export const metadata: Metadata = { title: 'Detalhes do aluno' };

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <StudentDetailsView id={params.id} />;
}

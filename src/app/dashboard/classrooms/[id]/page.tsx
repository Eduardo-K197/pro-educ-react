import type { Metadata } from 'next';

import { ClassroomDetailsView } from 'src/sections/classroom/view';

export const metadata: Metadata = { title: 'Detalhes da turma' };

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <ClassroomDetailsView id={params.id} />;
}

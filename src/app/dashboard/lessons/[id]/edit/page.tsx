import type { Metadata } from 'next';
import { LessonEditView } from 'src/sections/lesson/view';

export const metadata: Metadata = { title: 'Editar aula' };

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <LessonEditView id={params.id} />;
}

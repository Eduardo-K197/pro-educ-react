import type { Metadata } from 'next';
import { ClassroomCreateView } from 'src/sections/classroom/view';

export const metadata: Metadata = { title: 'Nova turma' };

export default function Page() {
  return <ClassroomCreateView />;
}

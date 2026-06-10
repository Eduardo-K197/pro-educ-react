import type { Metadata } from 'next';
import { StudentListView } from 'src/sections/student/view';

export const metadata: Metadata = { title: 'Alunos' };

export default function Page() {
  return <StudentListView />;
}

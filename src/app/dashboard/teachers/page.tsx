import type { Metadata } from 'next';
import { TeacherListView } from 'src/sections/teacher/view';

export const metadata: Metadata = { title: 'Professores' };

export default function Page() {
  return <TeacherListView />;
}

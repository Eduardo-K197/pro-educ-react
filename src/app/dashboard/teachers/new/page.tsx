import type { Metadata } from 'next';
import { TeacherCreateView } from 'src/sections/teacher/view';

export const metadata: Metadata = { title: 'Novo professor' };

export default function Page() {
  return <TeacherCreateView />;
}

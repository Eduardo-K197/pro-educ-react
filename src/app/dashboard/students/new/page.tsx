import type { Metadata } from 'next';
import { StudentCreateView } from 'src/sections/student/view';

export const metadata: Metadata = { title: 'Novo aluno' };

export default function Page() {
  return <StudentCreateView />;
}

import type { Metadata } from 'next';

import { StudentLayout } from 'src/sections/learning-student/student-layout';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'Área do aluno' };

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return <StudentLayout>{children}</StudentLayout>;
}

import type { Metadata } from 'next';
import { CourseListView } from 'src/sections/course/view';

export const metadata: Metadata = { title: 'Cursos' };

export default function Page() {
  return <CourseListView />;
}

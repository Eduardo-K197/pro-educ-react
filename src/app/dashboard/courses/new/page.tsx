import type { Metadata } from 'next';
import { CourseCreateView } from 'src/sections/course/view';

export const metadata: Metadata = { title: 'Novo curso' };

export default function Page() {
  return <CourseCreateView />;
}

import type { Metadata } from 'next';
import { LessonCreateView } from 'src/sections/lesson/view';

export const metadata: Metadata = { title: 'Nova aula' };

export default function Page() {
  return <LessonCreateView />;
}

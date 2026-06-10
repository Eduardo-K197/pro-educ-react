import type { Metadata } from 'next';
import { LessonListView } from 'src/sections/lesson/view';

export const metadata: Metadata = { title: 'Aulas' };

export default function Page() {
  return <LessonListView />;
}

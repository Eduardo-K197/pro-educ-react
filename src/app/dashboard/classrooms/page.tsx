import type { Metadata } from 'next';
import { ClassroomListView } from 'src/sections/classroom/view';

export const metadata: Metadata = { title: 'Turmas' };

export default function Page() {
  return <ClassroomListView />;
}

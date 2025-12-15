import type { Metadata } from 'next';
import { SchoolListView } from 'src/sections/school/school-list-view';

export const metadata: Metadata = {
  title: 'Schools',
};

export default function Page() {
  return <SchoolListView />;
}

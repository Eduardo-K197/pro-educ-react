import type { Metadata } from 'next';
import { SchoolCreateView } from 'src/sections/school/school-create-view';

export const metadata: Metadata = {
  title: 'Create school',
};

export default function Page() {
  return <SchoolCreateView />;
}

import type { Metadata } from 'next';

import { SchoolEditView } from 'src/sections/school/school-edit-view';

export const metadata: Metadata = {
  title: 'Edit school',
};

export default function Page() {
  return <SchoolEditView />;
}

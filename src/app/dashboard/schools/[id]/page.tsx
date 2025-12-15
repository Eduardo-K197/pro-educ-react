import type { Metadata } from 'next';

import { SchoolDetailsView } from 'src/sections/school/school-details-view';

export const metadata: Metadata = {
  title: 'School details',
};

export default function Page() {
  return <SchoolDetailsView />;
}

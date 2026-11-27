import type { Metadata } from 'next';

import { LearningCourseListView } from 'src/sections/learning/view';

export const metadata: Metadata = { title: 'ProEduc Learning' };

export default function Page() {
  return <LearningCourseListView />;
}

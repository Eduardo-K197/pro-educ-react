import { Suspense } from 'react';

import { StudentResetView } from 'src/sections/learning-student/view';

export default function Page() {
  return (
    <Suspense>
      <StudentResetView />
    </Suspense>
  );
}

import { Suspense } from 'react';

import { StudentInviteView } from 'src/sections/learning-student/view';

export default function Page() {
  return (
    <Suspense>
      <StudentInviteView />
    </Suspense>
  );
}

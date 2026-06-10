'use client';

import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { LessonNewEditForm } from '../lesson-new-edit-form';

export function LessonCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Nova aula"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Aulas', href: paths.dashboard.lessons.root },
          { name: 'Nova aula' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <LessonNewEditForm />
    </DashboardContent>
  );
}

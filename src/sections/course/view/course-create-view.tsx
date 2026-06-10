'use client';

import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { CourseNewEditForm } from '../course-new-edit-form';

export function CourseCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Novo curso"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Cursos', href: paths.dashboard.courses.root },
          { name: 'Novo curso' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <CourseNewEditForm />
    </DashboardContent>
  );
}

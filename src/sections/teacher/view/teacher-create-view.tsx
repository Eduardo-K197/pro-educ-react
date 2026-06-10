'use client';

import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { TeacherNewEditForm } from '../teacher-new-edit-form';

export function TeacherCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Novo professor"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Professores', href: paths.dashboard.teachers.root },
          { name: 'Novo professor' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <TeacherNewEditForm />
    </DashboardContent>
  );
}

'use client';

import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ClassroomNewEditForm } from '../classroom-new-edit-form';

export function ClassroomCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Nova turma"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Turmas', href: paths.dashboard.classrooms.root },
          { name: 'Nova turma' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <ClassroomNewEditForm />
    </DashboardContent>
  );
}

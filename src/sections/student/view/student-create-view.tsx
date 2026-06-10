'use client';

import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { StudentNewEditForm } from '../student-new-edit-form';

// ----------------------------------------------------------------------

export function StudentCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Novo aluno"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Alunos', href: paths.dashboard.students.root },
          { name: 'Novo aluno' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <StudentNewEditForm />
    </DashboardContent>
  );
}

'use client';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { SchoolNewEditForm } from './school-new-edit-form';

export function SchoolCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Cadastrar escola"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Escolas', href: paths.dashboard.schools.root },
          { name: 'Cadastrar' },
        ]}
      />

      <SchoolNewEditForm />
    </DashboardContent>
  );
}

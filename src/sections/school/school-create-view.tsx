'use client';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { paths } from 'src/routes/paths';
import { SchoolNewEditForm } from './school-new-edit-form';

export function SchoolCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create school"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Schools', href: paths.dashboard.schools.root },
          { name: 'Create' },
        ]}
      />

      <SchoolNewEditForm />
    </DashboardContent>
  );
}

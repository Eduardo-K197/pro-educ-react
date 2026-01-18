'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AdminNewEditForm } from '../admin-new-edit-form'; 

// ----------------------------------------------------------------------

export function AdminCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new admin"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Admins', href: paths.dashboard.admins.root },
          { name: 'New admin' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      
      <AdminNewEditForm />
    </DashboardContent>
  );
}
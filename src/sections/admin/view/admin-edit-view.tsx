'use client';

import type { IAdminItem } from 'src/types/services/admin';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AdminNewEditForm } from '../admin-new-edit-form';

// ----------------------------------------------------------------------

type Props = {
  admin?: IAdminItem; 
};

export function AdminEditView({ admin: currentAdmin }: Props) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit Admin"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Admins', href: paths.dashboard.admins.root },
          { name: currentAdmin?.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AdminNewEditForm currentAdmin={currentAdmin} />
    </DashboardContent>
  );
}
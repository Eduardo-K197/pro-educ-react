'use client';

import type { IGroupCreatePayload, IGroupUpdatePayload } from 'src/types/group';

import { useState } from 'react';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { GroupService } from 'src/services/group';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { GroupNewEditForm } from 'src/sections/group/group-new-edit-form';

export function GroupCreateView() {
  const [loading, setLoading] = useState(false);

  const handleCreate = async (payload: IGroupCreatePayload | IGroupUpdatePayload) => {
    setLoading(true);
    try {
      await GroupService.create(payload as any);
      // redireciona para a lista
      window.location.href = `${paths.dashboard.root}/groups`;
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Novo grupo"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Grupos', href: `${paths.dashboard.root}/groups` },
          { name: 'Novo' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={`${paths.dashboard.root}/groups`}
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
          >
            Voltar
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <GroupNewEditForm
        onSubmit={handleCreate}
        loading={loading}
        onCancel={() => { window.location.href = `${paths.dashboard.root}/groups`; }}
      />
    </DashboardContent>
  );
}

'use client';

import { useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Iconify } from 'src/components/iconify';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { GroupNewEditForm } from 'src/sections/group/group-new-edit-form';

import { GroupService } from 'src/services/group';

import type { IGroupCreatePayload, IGroupUpdatePayload } from 'src/types/group';

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

      <Stack spacing={3}>
        <GroupNewEditForm onSubmit={handleCreate} loading={loading} />
      </Stack>
    </DashboardContent>
  );
}

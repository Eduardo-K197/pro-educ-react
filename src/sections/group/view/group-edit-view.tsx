'use client';

import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Iconify } from 'src/components/iconify';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { GroupNewEditForm } from 'src/sections/group/group-new-edit-form';
import { GroupService } from 'src/services/group';
import type { IGroupItem, IGroupUpdatePayload } from 'src/types/group';

type Props = {
  id: string;
};

export function GroupEditView({ id }: Props) {
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState<IGroupItem | null>(null);

  useEffect(() => {
    let mounted = true;
    GroupService.getById(id).then((data) => {
      if (mounted) setGroup(data);
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleUpdate = async (payload: IGroupUpdatePayload) => {
    setLoading(true);
    try {
      await GroupService.update(id, payload);
      window.location.href = `${paths.dashboard.root}/groups`;
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Editar grupo"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Grupos', href: `${paths.dashboard.root}/groups` },
          { name: 'Editar' },
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
        {group && (
          <GroupNewEditForm
            initialValues={group}
            isEdit
            onSubmit={handleUpdate}
            loading={loading}
          />
        )}
      </Stack>
    </DashboardContent>
  );
}

'use client';

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Iconify } from 'src/components/iconify';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import type { IGroupItem } from 'src/types/group';

type Props = {
  group: IGroupItem;
};

export function GroupDetailsView({ group }: Props) {
  const totalSchools = group.groupSchool?.length ?? 0;
  const totalAdmins = group.groupAdmin?.length ?? 0;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={group.name}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Grupos', href: `${paths.dashboard.root}/groups` },
          { name: 'Detalhes' },
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

      <Card sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {group.name}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
          <Typography
            variant="caption"
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              px: 1,
              py: 0.25,
              borderRadius: 1,
            }}
          >
            {totalSchools} {totalSchools === 1 ? 'escola' : 'escolas'}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              bgcolor: 'secondary.main',
              color: 'secondary.contrastText',
              px: 1,
              py: 0.25,
              borderRadius: 1,
            }}
          >
            {totalAdmins} {totalAdmins === 1 ? 'admin' : 'admins'}
          </Typography>
        </Stack>

        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Escolas do grupo
          </Typography>
          {totalSchools === 0 && (
            <Typography variant="body2" color="text.secondary">
              Nenhuma escola vinculada.
            </Typography>
          )}
          {group.groupSchool?.map((gs) => (
            <Typography key={gs.id} variant="body2">
              • {gs.school.name}
            </Typography>
          ))}
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Admins do grupo
          </Typography>
          {totalAdmins === 0 && (
            <Typography variant="body2" color="text.secondary">
              Nenhum admin vinculado.
            </Typography>
          )}
          {group.groupAdmin?.map((ga) => (
            <Typography key={ga.id} variant="body2">
              • {ga.admin.name}
            </Typography>
          ))}
        </Box>
      </Card>
    </DashboardContent>
  );
}

'use client';

import Grid from '@mui/material/Unstable_Grid2';
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
import { GroupDetailsViewCard } from '../group-details-view-card';
import { IAdminItem } from '@/types/services/admin';

import { useState } from 'react';
import { GroupQuickAddAdmin } from '../group-quick-add-admin';
import { GroupQuickAddSchool } from '../group-quick-add-school';
import { GroupQuickEdit } from '../group-quick-edit-form';

type Props = {
  group: IGroupItem;
  adminList: IAdminItem[];
};

export function GroupDetailsView({ group, adminList }: Props) {
  const totalSchools = group.groupSchool?.length ?? 0;
  const totalAdmins = group.groupAdmin?.length ?? 0;

  const adminsId = group.groupAdmin?.map(a => a.admin?.id) ?? [];
  const groupAdminsById = adminList.filter(a => adminsId.includes(a.id))

  const [openAddAdmin, setOpenAddAdmin] = useState(false);
  const [openAddSchool, setOpenAddSchool] = useState(false);
  const [openEditGroup, setOpenEditGroup] = useState(false);

  return (

  <DashboardContent>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
        <Typography
            variant="caption"
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontSize: 18
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
              fontSize: 18
            }}
          >
            {totalAdmins} {totalAdmins === 1 ? 'admin' : 'admins'}
        </Typography>
      </Stack>
    <CustomBreadcrumbs
        heading={group.name}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Grupos', href: `${paths.dashboard.root}/groups` },
          { name: 'Detalhes' },
        ]}
        action={
          <Stack sx={{display: 'flex', flexDirection: 'row', gap: 3}}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={() => setOpenEditGroup(true)}
            >
              Editar Grupo
            </Button>
            <Button
              component={RouterLink}
              href={`${paths.dashboard.root}/groups`}
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
            >
              Voltar
            </Button>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
    />


    <Card sx={{ p: 2 }}>

        <Box sx={{ mt: 3 }}>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" fontSize={20} fontWeight={"bold"} sx={{ mb: 1 }}>
            Administradores
          </Typography>

            <Button
              variant="outlined"
              startIcon={<Iconify icon="mingcute:add-line"  />}
              onClick={() => setOpenAddAdmin(true)}
            >
              Adicionar Admin
            </Button>
          </Box>

              {totalAdmins === 0 && (
                <Typography variant="body2">
                  Nenhuma escola encontrada
                </Typography>
              )}
              <Grid container spacing={3} mt={3}>
                {groupAdminsById.map((ga) => (
                  <Grid xs={12} sm={6} md={4} key={ga.id}>
                    <GroupDetailsViewCard  
                      item={ga} 
                      type='admin' 
                    />
                  </Grid>
                ))}
              </Grid>
        </Box>

        <Box sx={{ mt: 1 }}>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3}}>
            <Typography variant="subtitle2" fontSize={20} fontWeight={"bold"} sx={{ mb: 1 }}>
              Escolas
            </Typography>

            <Button
              variant="outlined"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setOpenAddSchool(true)}
            >
              Adicionar Escola
            </Button>
          </Box>

            {totalSchools === 0 && (
              <Typography variant="body2" color="text.secondary">
                Nenhuma escola vinculada.
              </Typography>
            )}
            <Grid container spacing={3} mt={3}>
              {group.groupSchool?.map((gs) => (
              <Grid xs={12} sm={6} md={4} key={gs.id}>
                <GroupDetailsViewCard
                  item={gs} 
                  type='school' 
                />
              </Grid>
              ))}
            </Grid>
        </Box>
      </Card>

      {openAddAdmin && (
        <GroupQuickAddAdmin
          open={openAddAdmin}
          onClose={() => setOpenAddAdmin(false)}
          groupId={group.id}
        />
      )}

      {openAddSchool && (
        <GroupQuickAddSchool
          open={openAddSchool}
          onClose={() => setOpenAddSchool(false)}
          groupId={group.id}
        />
      )}

      {openEditGroup && (
        <GroupQuickEdit
          open={openEditGroup}
          onClose={() => setOpenEditGroup(false)}
          currentGroup={group}
        />
      )}
    </DashboardContent>
  );
}

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
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { IAdminItem } from '@/types/services/admin';
import { ISchoolItem } from '@/types/services/school';
import type { IGroupItem } from 'src/types/group';

import { useState, useCallback, useMemo } from 'react'; // Adicione useMemo
import { GroupDetailsViewCard } from '../group-details-view-card';
import { GroupQuickAddAdmin } from '../group-quick-add-admin';
import { GroupQuickAddSchool } from '../group-quick-add-school';
import { GroupQuickEdit } from '../group-quick-edit-form';
import { GroupService } from '@/services/group';
import { toast } from 'sonner';


type Props = {
  group: IGroupItem;
  adminList: IAdminItem[];
  schoolList: ISchoolItem[];
};

export function GroupDetailsView({ group, adminList, schoolList }: Props) {
  const router = useRouter();

  const totalSchools = group.groupSchool?.length ?? 0;
  const totalAdmins = group.groupAdmin?.length ?? 0;

  const adminsId = useMemo(() => 
    group.groupAdmin?.map(a => a.admin?.id).filter(Boolean) as string[] ?? [], 
  [group]);

  const schoolsId = useMemo(() => 
    group.groupSchool?.map(s => s.school?.id).filter(Boolean) as string[] ?? [], 
  [group]);

  const groupAdminsById = useMemo(() => 
    adminList.filter(a => adminsId.includes(a.id)), 
  [adminList, adminsId]);


  const groupSchoolsById = useMemo(() => {
    const filteredSchools = schoolList.filter(s => schoolsId.includes(s.id));

    return filteredSchools.map((school) => {
        const adminsDestaEscola = groupAdminsById.filter((admin) => 
            admin.schools?.some((s: any) => {
                const idToCheck = s.id ?? s; 
                return String(idToCheck) === String(school.id);
            })
        );
        return { ...school, admins: adminsDestaEscola };
    });
  }, [schoolList, schoolsId, groupAdminsById]);


  const [openAddAdmin, setOpenAddAdmin] = useState(false);
  const [openAddSchool, setOpenAddSchool] = useState(false);
  const [openEditGroup, setOpenEditGroup] = useState(false);

  const handleRefresh = useCallback(() =>{
    router.refresh();
  }, [router])

  const handleDeleteAdmin = useCallback(async (adminId: string) => {
    try {
      const newAdminsIds = adminsId.filter((id) => id !== adminId)
      const currentSchoolIds = schoolsId

      await GroupService.update(group.id, {
        name: group.name,
        admins: newAdminsIds,
        schools: currentSchoolIds,
      } as any)

      toast.success('Admin removido do grupo!')
      await new Promise((resolve) => setTimeout(resolve, 1000));
      handleRefresh()
    }
    catch (error) {
      console.error(error);
      toast.error('Erro ao remover admin')
    }
  }, [group.id, adminsId, schoolsId, handleRefresh])

  const handleDeleteSchool = useCallback(async (schoolId: string) => {
    try {
      const newSchoolsIds = schoolsId.filter((id) => id !== schoolId)
      const currentAdminsIds = adminsId

      await GroupService.update(group.id, {
        name: group.name,
        admins: currentAdminsIds,
        schools: newSchoolsIds,
      } as any)

      toast.success('Escola removida do grupo!')

      await new Promise((resolve) => setTimeout(resolve, 1000));
      handleRefresh()
    }
    catch (error) {
      console.error(error);
      toast.error('Erro ao remover escola')
    }
  }, [group.id, adminsId, schoolsId, handleRefresh])

  return (
    <DashboardContent>
      
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
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
              Nenhum administrador encontrado
            </Typography>
          )}
          <Grid container spacing={3} mt={3}>
            {groupAdminsById.map((ga) => (
              <Grid xs={12} sm={6} md={4} key={ga.id}>
                <GroupDetailsViewCard  
                  item={ga} 
                  type='admin' 
                  groupId={group.id} 
                  onRefresh={handleRefresh}
                  onDeleteRow={() => handleDeleteAdmin(ga.id)}
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
            {groupSchoolsById.map((gs) => (
              <Grid xs={12} sm={6} md={4} key={gs.id}>
                <GroupDetailsViewCard
                  item={gs} 
                  type='school'
                  groupId={group.id} 
                  onRefresh={handleRefresh}
                  onDeleteRow={() => handleDeleteSchool(gs.id)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Card>

      {/* MODAIS */}
      {openAddAdmin && (
        <GroupQuickAddAdmin
          open={openAddAdmin}
          onClose={() => setOpenAddAdmin(false)}
          groupId={group.id}
          onRefresh={handleRefresh}
        />
      )}

      {openAddSchool && (
        <GroupQuickAddSchool
          open={openAddSchool}
          onClose={() => setOpenAddSchool(false)}
          groupId={group.id}
          onRefresh={handleRefresh}
        />
      )}

      {openEditGroup && (
        <GroupQuickEdit
          open={openEditGroup}
          onClose={() => setOpenEditGroup(false)}
          currentGroup={group}
          onRefresh={handleRefresh}
        />
      )}
    </DashboardContent>
  );
}
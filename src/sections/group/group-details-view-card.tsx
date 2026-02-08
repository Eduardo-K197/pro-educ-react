'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';

import { usePopover } from 'src/components/custom-popover';
import { useBoolean } from 'src/hooks/use-boolean';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { GroupAdminRelation, GroupSchoolRelation } from '@/types/group';
import { IAdminItem } from '@/types/services/admin';

import { GroupQuickAddAdmin } from './group-quick-add-admin';
import { GroupQuickAddSchool } from './group-quick-add-school';

interface GroupDetailsViewCardProps {
  item: IAdminItem | GroupSchoolRelation;
  type: 'admin' | 'school';
  onRefresh?: () => void;
  groupId?: string;
}

export function GroupDetailsViewCard({ type, item, onRefresh, groupId }: GroupDetailsViewCardProps) {
  const [openSchools, setOpenSchools] = useState(false);
  
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [editingSchool, setEditingSchool] = useState<any>(null);

  const confirm = useBoolean();
  const popover = usePopover();

  let itemId = '';
  let title = '';
  let subtitle = '';
  let icon = '';
  let detailsLink = '';
  let schoolCount = 0;
  let adminCount = 0;
  let schoolList: any[] = [];
  let adminList: any[] = [];

  let objectToEdit: any = null;

  if (type === 'admin') {
    const admin = item as IAdminItem;

    itemId = admin.id;
    title = admin.name;
    subtitle = admin.email;
    icon = 'solar:user-id-bold-duotone';
    schoolList = admin.schools ?? [];
    schoolCount = schoolList.length;

    detailsLink = paths.dashboard.admins.details(itemId);
    
    objectToEdit = admin;
  } else {
    const schoolRel = item as GroupSchoolRelation;
    
    itemId = schoolRel.school?.id;
    title = schoolRel.school?.name;
    icon = 'solar:buildings-bold-duotone';
    subtitle = schoolRel.school?.createdAt;
    adminList = schoolRel?.school?.admins ?? [];
    adminCount = adminList.length;

    detailsLink = paths.dashboard.schools.details(itemId);

    objectToEdit = schoolRel.school;
  }

  const isSchool = type === 'school';
  
  const showLabel = isSchool ? 'Ver admins' : 'Ver escolas';
  const hideLabel = isSchool ? 'Ocultar admins' : 'Ocultar escolas';

  const handleEditClick = () => {
    if (type === 'admin') {
      setEditingAdmin(objectToEdit);
    } else {
      setEditingSchool(objectToEdit);
    }
  };

  return (
    <>
      <Card
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Cabeçalho / título com Avatar */}
        <Box sx={{ p: 3, pb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={undefined} // Ajuste se tiver URL da imagem
              alt={title ?? 'logo'}
              sx={{ width: 40, height: 40, flexShrink: 0 }}
            >
              <Iconify icon={icon} width={24} />
            </Avatar>

            <Stack spacing={1} flexGrow={1} minWidth={0}>
              <Typography
                variant="subtitle1"
                component={RouterLink}
                href={detailsLink}
                sx={{
                  color: 'text.primary',
                  textDecoration: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {title ?? '—'}
              </Typography>

              <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                {subtitle || '-'}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Ações principais */}
        <Stack spacing={1} sx={{ p: 3, pt: 2 }}>
          
          {/* BOTÃO EDITAR (ALTERADO) */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:pen-bold" />}
            onClick={handleEditClick} // <--- Agora abre o modal
          >
            {type === 'admin' ? 'Editar Admin' : 'Editar Escola'}
          </Button>
     
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              color='error'
              onClick={() => {
                confirm.onTrue();
                popover.onClose();
              }}
            >
            {type === 'admin' ? 'Excluir Admin' : 'Excluir Escola'}
            </Button>

          {type === 'school' && (        
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:eye-bold" />}
              onClick={() => {
                confirm.onTrue();
                popover.onClose();
              }}
            >
              Acessar
            </Button>
          )} 

          <Button
            size="small"
            variant="text"
            endIcon={<Iconify icon={openSchools ? 'eva:arrow-up-fill' : 'eva:arrow-down-fill'} />}
            onClick={() => setOpenSchools((prev) => !prev)}
          >
            {openSchools ? hideLabel : showLabel}
          </Button>

          <Collapse in={openSchools} unmountOnExit>
            <Divider sx={{ my: 1 }} />

            {type === 'admin' && ( schoolCount > 0 ? (
              <Stack spacing={0.5}>
                {schoolList.map((gs: any, idx: number) => (
                  <Typography key={gs?.id ?? idx} variant="body2">
                    • {gs?.name ?? 'Sem nome'}
                  </Typography>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Nenhuma escola cadastrada neste grupo.
              </Typography>
            ))} 

            {type === 'school' && ( adminCount > 0 ? (
              <Stack spacing={0.5}>
                {adminList.map((ga: any, idx: number) => (
                  <Typography key={ga?.id ?? idx} variant="body2">
                    • {ga?.name ?? 'Sem nome'}
                  </Typography>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Nenhum admin vinculado.
              </Typography>
            ))} 
          </Collapse> 
        </Stack>
      </Card>

      {/* --- MODAIS DE EDIÇÃO RENDERIZADOS AQUI --- */}
      
      {editingAdmin && (
        <GroupQuickAddAdmin
          open={!!editingAdmin}
          currentAdmin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onRefresh={onRefresh}
          groupId="" 
        />
      )}

      {editingAdmin && (
        <GroupQuickAddAdmin
          open={!!editingAdmin}
          currentAdmin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onRefresh={onRefresh}
          groupId={groupId || ''} 
        />
      )}

      {editingSchool && (
        <GroupQuickAddSchool
          open={!!editingSchool}
          currentSchool={editingSchool}
          onClose={() => setEditingSchool(null)}
          onRefresh={onRefresh}
          groupId="" 
        />
      )}
    </>
  );
}
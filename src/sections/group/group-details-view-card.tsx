'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { useBoolean } from 'src/hooks/use-boolean';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { GroupAdminRelation, GroupSchoolRelation } from '@/types/group';
import { IAdminItem } from '@/types/services/admin';

interface GroupDetailsViewCardProps {
    item: IAdminItem | GroupSchoolRelation;
    type: 'admin' | 'school';
}

export function GroupDetailsViewCard({ type, item }: GroupDetailsViewCardProps) {
  const [openSchools, setOpenSchools] = useState(false);
  const [openAdmins, setOpenAdmins] = useState(false);

  const confirm = useBoolean();
  const popover = usePopover();

  let itemId = '';
  let title = '';
  let subtitle = '';
  let icon = '';
  let detailsLink = '';
  let editLink = '';
  let schoolCount = 0;
  let adminCount= 0;
  let schoolList: string[] = [];
  let adminList = [];

  if (type === 'admin') {
    const admin = item as IAdminItem;

    itemId = admin.id;
    title = admin.name;
    subtitle = admin.email;
    icon = 'solar:user-id-bold-duotone';
    schoolList = admin.schools ?? [];
    schoolCount = schoolList.length;

    detailsLink = paths.dashboard.admins.details(itemId)
    editLink = paths.dashboard.admins.edit(itemId)
  } else {
    const school = item as GroupSchoolRelation;
 
    itemId = school.school?.id;
    title = school.school?.name;
    icon = 'solar:buildings-bold-duotone'
    subtitle = school.school?.createdAt;
    adminList = school?.school.admins ?? [];
    adminCount = adminList.length;

    detailsLink = paths.dashboard.schools.details(itemId)
    editLink = paths.dashboard.schools.edit(itemId)
  }

  const isSchool = type === 'school';
  
  const listCount = isSchool ? adminCount : schoolCount;
  
  const showLabel = isSchool ? 'Ver admins' : 'Ver escolas';
  const hideLabel = isSchool ? 'Ocultar admins' : 'Ocultar escolas';

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
              src={icon ?? undefined}
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

        {/* Ações principais (igual “botões grandes” do job) */}
        <Stack spacing={1} sx={{ p: 3, pt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:pen-bold" />}
            component={RouterLink}
            href={editLink}
          >
            {type === 'admin' ? 'Editar Admin' : 'Editar Escola'}
          </Button>

          <Button
            variant="soft"
            size="small"
            startIcon={<Iconify icon="solar:eye-bold" />}
            component={RouterLink}
            href={detailsLink}
          >
            Ver detalhes
          </Button>

          {type === 'school' && (         
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              component={RouterLink}
              href={detailsLink}
              color='error'
              onClick={() => {
                confirm.onTrue();
                popover.onClose();
              }}
            >
              Excluir Escola
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
                  <Typography key={gs?.school?.id ?? idx} variant="body2">
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
                  <Typography key={ga?.admin?.id ?? idx} variant="body2">
                    • {ga?.admin?.name ?? 'Sem nome'}
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
    </>
  );
}

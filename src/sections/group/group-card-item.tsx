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

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

interface GroupCardItemProps {
  group: any;
}

export function GroupCardItem({ group }: GroupCardItemProps) {
  const [openSchools, setOpenSchools] = useState(false);
  const popover = usePopover();

  const schoolList = group?.groupSchool ?? [];
  const adminList = group?.groupAdmin ?? [];

  const schoolCount = schoolList.length;
  const adminCount = adminList.length;

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
        {/* Menu de ações no canto (igual JobItem) */}
        <IconButton
          onClick={popover.onOpen}
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
        >
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>

        {/* Cabeçalho / título com Avatar */}
        <Box sx={{ p: 3, pb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={group?.logo ?? undefined}
              alt={group?.name ?? 'logo'}
              sx={{ width: 40, height: 40, flexShrink: 0 }}
            >
              <Iconify icon="solar:buildings-2-bold-duotone" />
            </Avatar>

            <Stack spacing={1} flexGrow={1} minWidth={0}>
              <Typography
                variant="subtitle1"
                component={RouterLink}
                href={paths.dashboard.group.details(group?.id)}
                sx={{ color: 'text.primary', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {group?.name ?? '—'}
              </Typography>

              <Stack direction="row" spacing={1}>
                <Chip
                  size="small"
                  color="primary"
                  label={`${schoolCount} ${schoolCount === 1 ? 'escola' : 'escolas'}`}
                />
                <Chip
                  size="small"
                  color="secondary"
                  label={`${adminCount} ${adminCount === 1 ? 'admin' : 'admins'}`}
                />
              </Stack>
            </Stack>
          </Stack>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Infos rápidas no grid, no estilo JobItem */}
        <Box rowGap={1.5} display="grid" gridTemplateColumns="repeat(2, 1fr)" sx={{ p: 3, pt: 2 }}>
          {[
            {
              label: `${schoolCount} escola(s) no grupo`,
              icon: (
                <Iconify
                  width={16}
                  icon="solar:buildings-2-bold-duotone"
                  sx={{ flexShrink: 0 }}
                />
              ),
            },
            {
              label: `${adminCount} admin(s) vinculados`,
              icon: (
                <Iconify
                  width={16}
                  icon="solar:users-group-rounded-bold"
                  sx={{ flexShrink: 0 }}
                />
              ),
            },
          ].map((item) => (
            <Stack
              key={item.label}
              spacing={0.5}
              flexShrink={0}
              direction="row"
              alignItems="center"
              sx={{ color: 'text.secondary', minWidth: 0 }}
            >
              {item.icon}
              <Typography variant="caption" noWrap>
                {item.label}
              </Typography>
            </Stack>
          ))}
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Ações principais (igual “botões grandes” do job) */}
        <Stack spacing={1} sx={{ p: 3, pt: 2 }}>
          <Button
            variant="soft"
            size="small"
            startIcon={<Iconify icon="solar:eye-bold" />}
            component={RouterLink}
            href={paths.dashboard.group.details(group?.id)}
          >
            Ver detalhes
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:pen-bold" />}
            component={RouterLink}
            href={paths.dashboard.group.edit(group?.id)}
          >
            Editar grupo
          </Button>

          <Button
            size="small"
            variant="text"
            endIcon={
              <Iconify
                icon={openSchools ? 'eva:arrow-up-fill' : 'eva:arrow-down-fill'}
              />
            }
            onClick={() => setOpenSchools((prev) => !prev)}
          >
            {openSchools ? 'Ocultar escolas' : 'Ver escolas'}
          </Button>

          <Collapse in={openSchools} unmountOnExit>
            <Divider sx={{ my: 1 }} />

            {schoolCount > 0 ? (
              <Stack spacing={0.5}>
                {schoolList.map((gs: any, idx: number) => (
                  <Typography key={gs?.school?.id ?? idx} variant="body2">
                    • {gs?.school?.name ?? 'Sem nome'}
                  </Typography>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Nenhuma escola cadastrada neste grupo.
              </Typography>
            )}
          </Collapse>
        </Stack>
      </Card>

      {/* Popover de ações (igual job) */}
      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              popover.onClose();
            }}
            component={RouterLink}
            href={paths.dashboard.group.details(group?.id)}
          >
            <Iconify icon="solar:eye-bold" />
            <ListItemText primary="Ver detalhes" />
          </MenuItem>

          <MenuItem
            onClick={() => {
              popover.onClose();
            }}
            component={RouterLink}
            href={paths.dashboard.group.edit(group?.id)}
          >
            <Iconify icon="solar:pen-bold" />
            <ListItemText primary="Editar grupo" />
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}

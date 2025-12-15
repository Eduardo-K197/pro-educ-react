'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { fDateTime } from 'src/utils/format-time';

import type { SchoolListItem } from 'src/types/services/school';

type SchoolStatus = 'ok' | 'pending' | 'overdue';

type SchoolCardItemProps = {
  school: SchoolListItem;
};

function getSchoolStatus(school: SchoolListItem): SchoolStatus {
  const overdue = Number(school.entryOverdueCount ?? 0);
  const pending = Number(school.entryPendingCount ?? 0);

  if (overdue > 0) return 'overdue';
  if (pending > 0) return 'pending';
  return 'ok';
}

export function SchoolCardItem({ school }: SchoolCardItemProps) {
  const popover = usePopover();

  const status = useMemo(() => getSchoolStatus(school), [school]);

  const students = Number(school.studentCount ?? 0);
  const teachers = Number(school.teacherCount ?? 0);
  const courses = Number(school.courseCount ?? 0);
  const classes = Number(school.classCount ?? 0);
  const pending = Number(school.entryPendingCount ?? 0);
  const overdue = Number(school.entryOverdueCount ?? 0);
  const received = Number(school.entryReceivedCount ?? 0);

  const statusConfig = {
    ok: { label: 'Em dia', color: 'success' as const },
    pending: { label: 'Pendências', color: 'warning' as const },
    overdue: { label: 'Em atraso', color: 'error' as const },
  }[status];

  const asaasConfigured = !!school.asaasToken;

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
        {/* Menu de ações (mesmo estilo de Job / Group) */}
        <IconButton
          onClick={popover.onOpen}
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
        >
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>

        {/* Cabeçalho */}
        <Box sx={{ p: 3, pb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar alt={school.name} sx={{ width: 40, height: 40, flexShrink: 0 }}>
              <Iconify icon="solar:buildings-2-bold-duotone" />
            </Avatar>

            <Stack spacing={0.75} flexGrow={1} minWidth={0}>
              <Typography
                variant="subtitle1"
                component={RouterLink}
                href={paths.dashboard.schools.details(school.id)}
                sx={{
                  color: 'text.primary',
                  textDecoration: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {school.name}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Criada em {fDateTime(school.createdAt)}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                <Label color={statusConfig.color} variant="soft">
                  {statusConfig.label}
                </Label>

                <Chip
                  size="small"
                  color={asaasConfigured ? 'primary' : 'default'}
                  variant={asaasConfigured ? 'filled' : 'outlined'}
                  label={asaasConfigured ? 'Asaas configurado' : 'Asaas pendente'}
                />

                {school.asaasHomologationMode && (
                  <Chip size="small" color="warning" variant="outlined" label="Modo homologação" />
                )}
              </Stack>
            </Stack>
          </Stack>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Métricas principais (grid) */}
        <Box
          rowGap={1.5}
          display="grid"
          gridTemplateColumns="repeat(2, minmax(0, 1fr))"
          sx={{ p: 3, pt: 2 }}
        >
          {[
            {
              label: `${students} aluno(s)`,
              icon: <Iconify width={18} icon="solar:users-group-rounded-bold" />,
            },
            {
              label: `${teachers} professor(es)`,
              icon: <Iconify width={18} icon="solar:user-id-bold-duotone" />,
            },
            {
              label: `${courses} curso(s)`,
              icon: <Iconify width={18} icon="solar:book-2-bold-duotone" />,
            },
            {
              label: `${classes} turma(s)`,
              icon: <Iconify width={18} icon="solar:calendar-mark-bold-duotone" />,
            },
            {
              label: `${pending} lançamento(s) pendente(s)`,
              icon: <Iconify width={18} icon="solar:clock-circle-bold-duotone" />,
            },
            {
              label: `${overdue} lançamento(s) em atraso`,
              icon: <Iconify width={18} icon="solar:danger-triangle-bold-duotone" />,
            },
            {
              label: `${received} lançamento(s) recebidos`,
              icon: <Iconify width={18} icon="solar:check-circle-bold-duotone" />,
            },
          ].map((item) => (
            <Stack
              key={item.label}
              direction="row"
              alignItems="center"
              spacing={0.75}
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

        {/* Ações principais */}
        <Stack spacing={1} sx={{ p: 3, pt: 2 }}>
          <Button
            variant="soft"
            size="small"
            startIcon={<Iconify icon="solar:eye-bold" />}
            component={RouterLink}
            href={paths.dashboard.schools.details(school.id)}
          >
            Ver detalhes
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:pen-bold" />}
            component={RouterLink}
            href={paths.dashboard.schools.edit(school.id)}
          >
            Editar escola
          </Button>
        </Stack>
      </Card>

      {/* Popover de ações rápidas */}
      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={popover.onClose}
            component={RouterLink}
            href={paths.dashboard.schools.details(school.id)}
          >
            <Iconify icon="solar:eye-bold" />
            <ListItemText primary="Ver detalhes" />
          </MenuItem>

          <MenuItem
            onClick={popover.onClose}
            component={RouterLink}
            href={paths.dashboard.schools.edit(school.id)}
          >
            <Iconify icon="solar:pen-bold" />
            <ListItemText primary="Editar escola" />
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}

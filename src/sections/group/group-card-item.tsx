'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { usePopover } from 'src/components/custom-popover';
import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from '@/components/custom-dialog';
import { Groups } from '@/lib/proeduc/api';

interface GroupCardItemProps {
  group: any;
  onDeleteRow: () => void;
  onRefresh?: () => void;
}

export function GroupCardItem({ group, onDeleteRow, onRefresh }: GroupCardItemProps) {
  const [openSchools, setOpenSchools] = useState(false);

  const schoolList = group?.groupSchool ?? [];
  const adminList = group?.groupAdmin ?? [];

  const schoolCount = schoolList.length;
  const adminCount = adminList.length;

  const confirm = useBoolean();
  const popover = usePopover();

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
                sx={{
                  color: 'text.primary',
                  textDecoration: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
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
                <Iconify width={16} icon="solar:buildings-2-bold-duotone" sx={{ flexShrink: 0 }} />
              ),
            },
            {
              label: `${adminCount} admin(s) vinculados`,
              icon: (
                <Iconify width={16} icon="solar:users-group-rounded-bold" sx={{ flexShrink: 0 }} />
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
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              color='error'
              onClick={() => {
                confirm.onTrue()
                popover.onClose()
              }}
            >
              Excluir grupo
            </Button>          

          <Button
            size="small"
            variant="text"
            endIcon={<Iconify icon={openSchools ? 'eva:arrow-up-fill' : 'eva:arrow-down-fill'} />}
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

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Excluir"
        content={`Tem certeza que deseja deletar "${group?.name}" `}
        action={
          <Button
            variant='contained'
            color='error'
            onClick={() => {
              onDeleteRow();
              confirm.onFalse;
            }}
          >
            Deletar
          </Button>
        }
      />
    </>
  );
}

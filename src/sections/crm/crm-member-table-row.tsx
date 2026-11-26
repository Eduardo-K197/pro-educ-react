'use client';

import type { CrmMember } from 'src/types/services/crm';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { CRM_ROLE_LABELS, CRM_USER_TYPE_LABELS } from 'src/types/services/crm';

// ----------------------------------------------------------------------

const ROLE_COLOR = { agente: 'info', supervisor: 'warning', gestor: 'primary' } as const;

type Props = {
  row: CrmMember;
  selected: boolean;
  onSelectRow: () => void;
  onEditRow: () => void;
  onDeleteRow: () => void;
};

export function CrmMemberTableRow({ row, selected, onSelectRow, onEditRow, onDeleteRow }: Props) {
  const confirm = useBoolean();
  const popover = usePopover();
  const name = row.name ?? 'Usuário removido';

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 36, height: 36 }}>{name.charAt(0).toUpperCase()}</Avatar>
            <Stack>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, cursor: 'pointer' }}
                onClick={onEditRow}
              >
                {name}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {CRM_USER_TYPE_LABELS[row.userType]}
                {row.email ? ` · ${row.email}` : ''}
              </Typography>
            </Stack>
          </Stack>
        </TableCell>

        <TableCell>
          <Label variant="soft" color={ROLE_COLOR[row.role]}>
            {CRM_ROLE_LABELS[row.role]}
          </Label>
        </TableCell>

        <TableCell sx={{ maxWidth: 260 }}>
          {row.departments.length ? (
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {row.departments.map((d) => (
                <Chip key={d.id} label={d.name} size="small" variant="soft" />
              ))}
            </Stack>
          ) : (
            <Typography variant="caption" color="text.disabled">
              Sem setor
            </Typography>
          )}
        </TableCell>

        <TableCell>
          <Label variant="soft" color={row.active ? 'success' : 'default'}>
            {row.active ? 'Ativo' : 'Inativo'}
          </Label>
        </TableCell>

        <TableCell align="right" sx={{ px: 1 }}>
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
        <MenuList>
          <MenuItem
            onClick={() => {
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Editar
          </MenuItem>
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Remover do CRM
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Remover membro"
        content={
          <>
            Remover <strong>{name}</strong> da equipe do CRM? O usuário continua existindo no
            sistema.
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onDeleteRow();
              confirm.onFalse();
            }}
          >
            Remover
          </Button>
        }
      />
    </>
  );
}

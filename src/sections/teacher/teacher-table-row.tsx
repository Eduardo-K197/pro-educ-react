'use client';

import type { TeacherListItem } from 'src/types/services/teacher';

import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useBoolean } from 'src/hooks/use-boolean';
import { fDate } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: TeacherListItem;
  selected: boolean;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function TeacherTableRow({ row, selected, onSelectRow, onDeleteRow }: Props) {
  const router = useRouter();
  const confirm = useBoolean();
  const popover = usePopover();

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar src={row.picture?.url} sx={{ width: 36, height: 36 }}>
              {row.name?.charAt(0).toUpperCase() ?? '?'}
            </Avatar>
            <Stack>
              <Link
                color="inherit"
                sx={{ cursor: 'pointer', typography: 'body2', fontWeight: 600 }}
                onClick={() => router.push(paths.dashboard.teachers.details(row.id))}
              >
                {row.name}
              </Link>
              <Typography variant="caption" color="text.disabled">
                {row.email ?? '-'}
              </Typography>
            </Stack>
          </Stack>
        </TableCell>

        {/* Cursos */}
        <TableCell sx={{ maxWidth: 220 }}>
          {row.courses && row.courses.length > 0 ? (
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {row.courses.map((c) => (
                <Chip key={c.id} label={c.name} size="small" variant="soft" color="info" />
              ))}
            </Stack>
          ) : (
            <Typography variant="caption" color="text.disabled">
              Sem curso
            </Typography>
          )}
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {row.birthDate ? fDate(row.birthDate) : '-'}
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {row.hourlyProfit != null ? `R$ ${row.hourlyProfit.toFixed(2)}/h` : '-'}
        </TableCell>

        <TableCell align="right">
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              router.push(paths.dashboard.teachers.details(row.id));
              popover.onClose();
            }}
          >
            <Iconify icon="solar:eye-bold" />
            Ver detalhes
          </MenuItem>
          <MenuItem
            onClick={() => {
              router.push(paths.dashboard.teachers.edit(row.id));
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
            Excluir
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Excluir professor"
        content="Tem certeza que deseja excluir este professor?"
        action={
          <MenuItem
            onClick={() => { onDeleteRow(); confirm.onFalse(); }}
            sx={{ color: 'error.main' }}
          >
            Excluir
          </MenuItem>
        }
      />
    </>
  );
}

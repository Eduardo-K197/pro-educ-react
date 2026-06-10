'use client';

import type { ClassroomListItem } from 'src/types/services/classroom';

import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
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

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

type Props = {
  row: ClassroomListItem;
  selected: boolean;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function ClassroomTableRow({ row, selected, onSelectRow, onDeleteRow }: Props) {
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
          <Link
            color="inherit"
            sx={{ cursor: 'pointer', typography: 'body2', fontWeight: 600 }}
            onClick={() => router.push(paths.dashboard.classrooms.details(row.id))}
          >
            {row.name}
          </Link>
        </TableCell>

        <TableCell>
          {row.course ? (
            <Chip label={row.course.name} size="small" variant="outlined" />
          ) : (
            '-'
          )}
        </TableCell>

        {/* Matriculados */}
        <TableCell>
          <Typography variant="body2">{row.studentCount ?? 0}</Typography>
        </TableCell>

        {/* Capacidade */}
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {row.maxStudentCount != null ? row.maxStudentCount : '—'}
          </Typography>
        </TableCell>

        {/* Vagas Livres */}
        <TableCell>
          {row.maxStudentCount != null ? (() => {
            const vagas = row.maxStudentCount - (row.studentCount ?? 0);
            return (
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  typography: 'body2',
                  fontWeight: 600,
                  bgcolor: vagas > 0 ? 'success.lighter' : 'error.lighter',
                  color: vagas > 0 ? 'success.darker' : 'error.darker',
                }}
              >
                {vagas > 0 ? vagas : 'Lotada'}
              </Box>
            );
          })() : (
            <Typography variant="body2" color="text.disabled">—</Typography>
          )}
        </TableCell>

        <TableCell align="right">
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose} slotProps={{ arrow: { placement: 'right-top' } }}>
        <MenuList>
          <MenuItem onClick={() => { router.push(paths.dashboard.classrooms.edit(row.id)); popover.onClose(); }}>
            <Iconify icon="solar:pen-bold" />
            Editar
          </MenuItem>
          <MenuItem onClick={() => { confirm.onTrue(); popover.onClose(); }} sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold" />
            Excluir
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Excluir turma"
        content="Tem certeza que deseja excluir esta turma?"
        action={
          <MenuItem onClick={() => { onDeleteRow(); confirm.onFalse(); }} sx={{ color: 'error.main' }}>
            Excluir
          </MenuItem>
        }
      />
    </>
  );
}

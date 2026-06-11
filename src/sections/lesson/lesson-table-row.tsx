'use client';

import type { LessonListItem } from 'src/types/services/lesson';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
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

type Props = {
  row: LessonListItem;
  selected: boolean;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function LessonTableRow({ row, selected, onSelectRow, onDeleteRow }: Props) {
  const router = useRouter();
  const confirm = useBoolean();
  const popover = usePopover();

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        {/* Aula / Descrição */}
        <TableCell sx={{ minWidth: 160 }}>
          <Stack spacing={0.25}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {row.details ?? `Aula — ${row.course?.name ?? ''}`}
            </Typography>
          </Stack>
        </TableCell>

        {/* Turma */}
        <TableCell>
          {row.classroom ? (
            <Chip label={row.classroom.name} size="small" variant="soft" color="secondary" />
          ) : '-'}
        </TableCell>

        {/* Professor */}
        <TableCell>
          {row.teacher ? <Chip label={row.teacher.name} size="small" /> : '-'}
        </TableCell>

        {/* Data */}
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {row.date ? fDate(row.date) : '-'}
        </TableCell>

        {/* Horário */}
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {row.startTime || row.endTime ? (
            <Typography variant="body2" color="text.secondary">
              {row.startTime ?? '?'}{row.endTime ? ` – ${row.endTime}` : ''}
            </Typography>
          ) : '—'}
        </TableCell>

        {/* Status */}
        <TableCell>
          {row.status ? (
            <Chip label={row.status} size="small" variant="soft" color="default" />
          ) : '—'}
        </TableCell>

        <TableCell align="right">
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose} slotProps={{ arrow: { placement: 'right-top' } }}>
        <MenuList>
          <MenuItem onClick={() => { router.push(paths.dashboard.lessons.edit(row.id)); popover.onClose(); }}>
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
        title="Excluir aula"
        content="Tem certeza que deseja excluir esta aula?"
        action={
          <MenuItem onClick={() => { onDeleteRow(); confirm.onFalse(); }} sx={{ color: 'error.main' }}>
            Excluir
          </MenuItem>
        }
      />
    </>
  );
}

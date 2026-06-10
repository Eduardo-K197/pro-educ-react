'use client';

import type { CourseListItem } from 'src/types/services/course';

import Link from '@mui/material/Link';
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

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

type Props = {
  row: CourseListItem;
  selected: boolean;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function CourseTableRow({ row, selected, onSelectRow, onDeleteRow }: Props) {
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
            onClick={() => router.push(paths.dashboard.courses.details(row.id))}
          >
            {row.name}
          </Link>
          {row.description && (
            <Typography variant="caption" color="text.disabled" display="block" noWrap>
              {row.description}
            </Typography>
          )}
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {row.workload != null ? `${row.workload}h` : '-'}
        </TableCell>

        <TableCell>{row.teacherCount ?? 0} professor(es)</TableCell>
        <TableCell>{row.studentCount ?? 0} aluno(s)</TableCell>

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
          <MenuItem onClick={() => { router.push(paths.dashboard.courses.edit(row.id)); popover.onClose(); }}>
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
        title="Excluir curso"
        content="Tem certeza que deseja excluir este curso?"
        action={
          <MenuItem onClick={() => { onDeleteRow(); confirm.onFalse(); }} sx={{ color: 'error.main' }}>
            Excluir
          </MenuItem>
        }
      />
    </>
  );
}

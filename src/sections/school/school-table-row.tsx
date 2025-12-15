'use client';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';

import type { SchoolListItem } from 'src/types/services/school';

type Props = {
  row: SchoolListItem;
  selected: boolean;
  onSelectRow: () => void;
  onDeleteRow: () => void;
  onViewRow: () => void;
};

export function SchoolTableRow({ row, selected, onSelectRow, onDeleteRow, onViewRow }: Props) {
  const {
    name,
    createdAt,
    studentCount,
    courseCount,
    classCount,
    teacherCount,
    entryPendingCount,
    entryOverdueCount,
    entryReceivedCount,
  } = row;

  const hasOverdue = entryOverdueCount > 0;
  const hasPending = entryPendingCount > 0;

  let statusLabel = 'OK';
  let statusColor: 'success' | 'warning' | 'error' | 'default' = 'success';

  if (hasOverdue) {
    statusLabel = 'Overdue';
    statusColor = 'error';
  } else if (hasPending) {
    statusLabel = 'Pending';
    statusColor = 'warning';
  }

  return (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onClick={onSelectRow} />
      </TableCell>

      <TableCell sx={{ minWidth: 200 }}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2" noWrap sx={{ cursor: 'pointer' }} onClick={onViewRow}>
            {name}
          </Typography>

          <Label variant="soft" color={statusColor} sx={{ alignSelf: 'flex-start' }}>
            {statusLabel}
          </Label>
        </Stack>
      </TableCell>

      <TableCell sx={{ minWidth: 160 }}>{fDateTime(createdAt)}</TableCell>

      <TableCell align="center">{studentCount}</TableCell>
      <TableCell align="center">{courseCount}</TableCell>
      <TableCell align="center">{classCount}</TableCell>
      <TableCell align="center">{teacherCount}</TableCell>
      <TableCell align="center">{entryPendingCount}</TableCell>
      <TableCell align="center">{entryOverdueCount}</TableCell>
      <TableCell align="center">{entryReceivedCount}</TableCell>

      <TableCell align="right">
        <IconButton color="primary" onClick={onViewRow}>
          <Iconify icon="eva:arrow-ios-forward-fill" />
        </IconButton>

        <IconButton color="error" onClick={onDeleteRow}>
          <Iconify icon="solar:trash-bin-trash-bold" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

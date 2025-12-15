import type { AdminListItem } from 'src/types/services/admin';

import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

type Props = {
  row: AdminListItem;
  selected: boolean;
  onViewRow: () => void;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function AdminTableRow({ row, selected, onViewRow, onSelectRow, onDeleteRow }: Props) {
  const router = useRouter();
  const confirm = useBoolean();

  const handleEdit = () => {
    router.push(paths.dashboard.admins.edit(row.id));
  };

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 36, height: 36 }}>
              {row.name ? row.name.charAt(0).toUpperCase() : '?'}
            </Avatar>

            <Stack spacing={0.25}>
              <Typography variant="subtitle2" noWrap>
                {row.name}
              </Typography>

              <Typography variant="body2" color="text.secondary" noWrap>
                {row.email}
              </Typography>
            </Stack>
          </Stack>
        </TableCell>

        <TableCell width={180}>
          <Typography variant="body2" noWrap>
            {fDateTime(row.createdAt)}
          </Typography>
        </TableCell>

        <TableCell align="right" width={88}>
          <IconButton color="primary" onClick={onViewRow}>
            <Iconify icon="eva:eye-fill" />
          </IconButton>

          <IconButton color="primary" onClick={handleEdit}>
            <Iconify icon="eva:edit-fill" />
          </IconButton>

          <IconButton color="error" onClick={confirm.onTrue}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </TableCell>
      </TableRow>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <IconButton
            onClick={() => {
              onDeleteRow();
              confirm.onFalse();
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        }
      />
    </>
  );
}

import type { AdminListItem } from 'src/types/services/admin';

import { fDate, fTime } from 'src/utils/format-time';

import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import { Box } from '@mui/material';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { useBoolean } from 'src/hooks/use-boolean';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Label } from 'src/components/label';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { AdminQuickEditForm } from './admin-quick-edit-form';


// ----------------------------------------------------------------------

type Props = {
  row: AdminListItem;
  selected: boolean;
  onViewRow: () => void;
  onSelectRow: () => void;
  onEditRow: () => void;
  onDeleteRow: () => void;
};

export function AdminTableRow({ row, selected, onViewRow, onEditRow, onSelectRow, onDeleteRow }: Props) {
  const router = useRouter();
  const confirm = useBoolean();

  const quickEdit = useBoolean();
  const popover = usePopover();


  const { name, email, createdAt, id } = row;

  const handleEdit = () => {
    router.push(paths.dashboard.admins.edit(row.id));
  };

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox id={row.id} checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 36, height: 36 }}>
              {row.name ? row.name.charAt(0).toUpperCase() : '?'}
            </Avatar>

            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Link color="inherit" onClick={onEditRow} sx={{ cursor: 'pointer' }}>
                {row.name}
              </Link>
              <Box component="span" sx={{ color: 'text.disabled', typography: 'body2' }}>
                {row.email}
              </Box>
            </Stack>
          </Stack>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <ListItemText
            primary={fDate(createdAt)}
            secondary={fTime(createdAt)} 
            primaryTypographyProps={{ typography: 'body2' }}
            secondaryTypographyProps={{ typography: 'caption', color: 'text.disabled' }}
          />
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row.status === 'active' && 'success') ||
              (row.status === 'pending' && 'warning') ||
              (row.status === 'banned' && 'error') ||
              'default'
            }
          >
            {row.status}
          </Label>
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center">
            <Tooltip title="Quick Edit" placement="top" arrow>
              <IconButton
                color={quickEdit.value ? 'inherit' : 'default'}
                onClick={quickEdit.onTrue}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>

            <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>
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
                    confirm.onTrue();
                    popover.onClose();
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" />
                  Delete
                </MenuItem>
      
                <MenuItem
                  onClick={() => {
                    onEditRow();
                    popover.onClose();
                  }}
                >
                  <Iconify icon="solar:pen-bold" />
                  Edit
                </MenuItem>
              </MenuList>
            </CustomPopover>

      <AdminQuickEditForm currentAdmin={row} open={quickEdit.value} onClose={quickEdit.onFalse} />

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

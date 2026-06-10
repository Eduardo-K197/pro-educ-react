'use client';

import type { IconButtonProps } from '@mui/material/IconButton';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';

import { varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { AnimateAvatar } from 'src/components/animate';

import { useAuthContext } from 'src/auth/hooks';

import { AccountButton } from './account-button';
import { SignOutButton } from './sign-out-button';

// ----------------------------------------------------------------------

const ROLE_LABEL: Record<string, string> = {
  superAdmin: 'Super Admin',
  admin: 'Administrador',
  teacher: 'Professor',
  employee: 'Funcionário',
};

export type AccountDrawerProps = IconButtonProps;

export function AccountDrawer({ sx, ...other }: AccountDrawerProps) {
  const theme = useTheme();
  const { user } = useAuthContext();

  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  const displayName = user?.displayName ?? user?.name ?? 'Usuário';
  const email = user?.email ?? '';
  const role = user?.role ?? 'admin';
  const roleLabel = ROLE_LABEL[role] ?? role;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <>
      <AccountButton
        onClick={handleOpen}
        photoURL={user?.photoURL}
        displayName={displayName}
        sx={sx}
        {...other}
      />

      <Drawer
        open={open}
        onClose={handleClose}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 300 } }}
      >
        <IconButton
          onClick={handleClose}
          sx={{ top: 12, left: 12, zIndex: 9, position: 'absolute' }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>

        <Scrollbar>
          {/* Avatar + info */}
          <Stack alignItems="center" sx={{ pt: 8, pb: 3, px: 2.5 }}>
            <AnimateAvatar
              width={88}
              slotProps={{
                avatar: { src: user?.photoURL, alt: displayName },
                overlay: {
                  border: 2,
                  spacing: 3,
                  color: `linear-gradient(135deg, ${varAlpha(theme.vars.palette.primary.mainChannel, 0)} 25%, ${theme.vars.palette.primary.main} 100%)`,
                },
              }}
            >
              {initials}
            </AnimateAvatar>

            <Typography variant="subtitle1" noWrap sx={{ mt: 2 }}>
              {displayName}
            </Typography>

            <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
              {email}
            </Typography>

            <Chip
              size="small"
              label={roleLabel}
              color={role === 'superAdmin' ? 'error' : 'default'}
              variant="soft"
              sx={{ mt: 1 }}
            />
          </Stack>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Espaço para futuros itens de menu */}
          <Box sx={{ p: 2.5 }}>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.disabled" sx={{ px: 1, pb: 0.5 }}>
                Conta
              </Typography>
            </Stack>
          </Box>
        </Scrollbar>

        <Box sx={{ p: 2.5, borderTop: `1px solid ${theme.vars.palette.divider}` }}>
          <SignOutButton onClose={handleClose} />
        </Box>
      </Drawer>
    </>
  );
}

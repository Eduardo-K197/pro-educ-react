'use client';

import type { SxProps, Theme } from '@mui/material/styles';

import { useEffect, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import ListItemText from '@mui/material/ListItemText';

import { useAuthContext } from 'src/auth/hooks';
import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { STORAGE_KEYS } from 'src/utils/axios';

// ----------------------------------------------------------------------

type SchoolItem = { id: string; name: string };

type Props = { sx?: SxProps<Theme> };

export function SchoolSwitcher({ sx }: Props) {
  const popover = usePopover();
  const { user } = useAuthContext();

  const schools: SchoolItem[] = ((user?.schools as any[]) ?? []).map((s: any) => ({
    id: s.id,
    name: s.name ?? s.razaoSocial ?? 'Escola',
  }));

  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem(STORAGE_KEYS.schoolId);
    setActiveId(stored ?? schools[0]?.id ?? null);
  }, [schools]);

  const activeName =
    schools.find((s) => s.id === activeId)?.name ?? schools[0]?.name ?? 'Escola';

  const handleSwitch = useCallback(
    (school: SchoolItem) => {
      if (typeof window === 'undefined') return;
      popover.onClose();
      if (school.id === activeId) return;
      sessionStorage.setItem(STORAGE_KEYS.schoolId, school.id);
      // Reload to re-fetch all data with the new school context
      window.location.reload();
    },
    [activeId, popover]
  );

  // Only render when the user has multiple schools
  if (schools.length <= 1) {
    // Single school — just show the name without a dropdown
    if (!activeName) return null;
    return (
      <Tooltip title="Escola ativa" placement="bottom">
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            cursor: 'default',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            ...sx,
          }}
        >
          <Box
            sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', flexShrink: 0 }}
          />
          <Typography variant="subtitle2" noWrap sx={{ maxWidth: 200 }}>
            {activeName}
          </Typography>
        </Stack>
      </Tooltip>
    );
  }

  return (
    <>
      <Tooltip title="Trocar escola" placement="bottom">
        <ButtonBase
          onClick={popover.onOpen}
          sx={{
            px: 1.5,
            py: 0.5,
            gap: 0.75,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            '&:hover': { opacity: 0.88 },
            ...sx,
          }}
        >
          <Box
            sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', flexShrink: 0 }}
          />
          <Typography variant="subtitle2" noWrap sx={{ maxWidth: 180 }}>
            {activeName}
          </Typography>
          <Iconify
            icon="eva:chevron-down-fill"
            width={16}
            sx={{ color: 'text.secondary', flexShrink: 0 }}
          />
        </ButtonBase>
      </Tooltip>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'top-left' } }}
      >
        <MenuList sx={{ minWidth: 200, p: 0.5 }}>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ px: 1.5, py: 0.75, display: 'block' }}
          >
            Suas escolas
          </Typography>

          {schools.map((school) => (
            <MenuItem
              key={school.id}
              selected={school.id === activeId}
              onClick={() => handleSwitch(school)}
              sx={{ borderRadius: 0.75 }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  mr: 1.5,
                  borderRadius: '50%',
                  flexShrink: 0,
                  bgcolor: school.id === activeId ? 'success.main' : 'text.disabled',
                }}
              />
              <ListItemText
                primary={school.name}
                primaryTypographyProps={{ variant: 'body2', noWrap: true }}
              />
              {school.id === activeId && (
                <Iconify icon="eva:checkmark-fill" width={16} sx={{ color: 'success.main', ml: 1 }} />
              )}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover>
    </>
  );
}

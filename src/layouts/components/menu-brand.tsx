import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/config-global';

// Menu-only assets: other uses of Logo retain their original appearance.
export function MenuBrand({ compact = false, sx, ...other }: BoxProps & { compact?: boolean }) {
  return (
    <Box
      component={RouterLink}
      href={paths.dashboard.root}
      aria-label="ProEduc — Painel"
      sx={{
        width: compact ? 42 : 184,
        height: compact ? 48 : 64,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1,
        '&:focus-visible': { outline: '2px solid white', outlineOffset: 2 },
        ...sx,
      }}
      {...other}
    >
      <Box
        component="img"
        alt="ProEduc"
        src={`${CONFIG.assetsDir}/logo/${compact ? 'logo-menu-symbol-white.svg' : 'logo-menu-white.svg'}`}
        sx={{ width: 1, height: 1, objectFit: 'contain', display: 'block' }}
      />
    </Box>
  );
}

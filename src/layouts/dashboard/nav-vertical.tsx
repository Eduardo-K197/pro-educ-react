import type { Breakpoint } from '@mui/material/styles';
import type { NavSectionProps } from 'src/components/nav-section';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { varAlpha, hideScrollY } from 'src/theme/styles';

import { Scrollbar } from 'src/components/scrollbar';
import { NavSectionMini, NavSectionVertical } from 'src/components/nav-section';

import { MenuBrand } from '../components/menu-brand';
import { NavUpgrade } from '../components/nav-upgrade';
import { NavToggleButton } from '../components/nav-toggle-button';

// ----------------------------------------------------------------------

export type NavVerticalProps = NavSectionProps & {
  isNavMini: boolean;
  layoutQuery: Breakpoint;
  onToggleNav: () => void;
  slots?: {
    topArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
  };
};

export function NavVertical({
  sx,
  data,
  slots,
  isNavMini,
  layoutQuery,
  onToggleNav,
  ...other
}: NavVerticalProps) {
  const theme = useTheme();

  const renderNavVertical = (
    <>
      {slots?.topArea ?? (
        <Box
          sx={{
            minHeight: 72,
            bgcolor: '#0F62C2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 3,
          }}
        >
          <MenuBrand />
        </Box>
      )}

      <Scrollbar fillContent>
        <NavSectionVertical data={data} sx={{ px: 2, flex: '1 1 auto' }} {...other} />

        {slots?.bottomArea ?? <NavUpgrade />}
      </Scrollbar>
    </>
  );

  const renderNavMini = (
    <>
      {slots?.topArea ?? (
        <Box
          sx={{
            minHeight: 72,
            bgcolor: '#0F62C2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MenuBrand compact />
        </Box>
      )}

      <NavSectionMini
        data={data}
        sx={{ pb: 2, px: 0.5, ...hideScrollY, flex: '1 1 auto', overflowY: 'auto' }}
        {...other}
      />

      {slots?.bottomArea}
    </>
  );

  return (
    <Box
      sx={{
        top: 0,
        left: 0,
        height: 1,
        display: 'none',
        position: 'fixed',
        flexDirection: 'column',
        bgcolor: 'var(--layout-nav-bg)',
        zIndex: 'var(--layout-nav-zIndex)',
        width: isNavMini ? 'var(--layout-nav-mini-width)' : 'var(--layout-nav-vertical-width)',
        borderRight: `1px solid var(--layout-nav-border-color, ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)})`,
        transition: theme.transitions.create(['width'], {
          easing: 'var(--layout-transition-easing)',
          duration: 'var(--layout-transition-duration)',
        }),
        [theme.breakpoints.up(layoutQuery)]: {
          display: 'flex',
        },
        ...sx,
      }}
    >
      <NavToggleButton
        aria-label={isNavMini ? 'Expandir menu' : 'Recolher menu'}
        isNavMini={isNavMini}
        onClick={onToggleNav}
        sx={{
          display: 'none',
          color: 'common.white',
          bgcolor: '#0F62C2',
          borderColor: 'rgba(255,255,255,0.35)',
          '&:hover': { bgcolor: '#0B4F9D', color: 'common.white' },
          [theme.breakpoints.up(layoutQuery)]: {
            display: 'inline-flex',
          },
        }}
      />
      {isNavMini ? renderNavMini : renderNavVertical}
    </Box>
  );
}

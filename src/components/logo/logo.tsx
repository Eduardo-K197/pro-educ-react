'use client';

import type { BoxProps } from '@mui/material/Box';

import { forwardRef } from 'react';

import Box from '@mui/material/Box';

import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/config-global';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export type LogoProps = BoxProps & {
  href?: string;
  isSingle?: boolean;
  disableLink?: boolean;
};

export const Logo = forwardRef<HTMLDivElement, LogoProps>(
  (
    { width, href = '/', height, isSingle = false, disableLink = false, className, sx, ...other },
    ref
  ) => {
    const singleLogo = (
      <Box
        alt="Logo ProEduc"
        component="img"
        src={`${CONFIG.assetsDir}/logo/logo-single.svg`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).onerror = null;
          (e.currentTarget as HTMLImageElement).src = `${CONFIG.assetsDir}/logo/logo-single.png`;
        }}
        width="100%"
        height="100%"
        sx={{ objectFit: 'contain' }}
      />
    );

    const fullLogo = (
      <Box
        alt="Logo ProEduc"
        component="img"
        src={`${CONFIG.assetsDir}/logo/logo-full.png`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).onerror = null;
          (e.currentTarget as HTMLImageElement).src = `${CONFIG.assetsDir}/logo/logo-full.svg`;
        }}
        width="100%"
        height="100%"
        sx={{ objectFit: 'contain' }}
      />
    );

    const baseSize = {
      width: width ?? 40,
      height: height ?? 40,
      ...(!isSingle && {
        width: width ?? 102,
        height: height ?? 36,
      }),
    };

    return (
      <Box
        ref={ref}
        component={RouterLink}
        href={href}
        className={logoClasses.root.concat(className ? ` ${className}` : '')}
        aria-label="Logo"
        sx={{
          ...baseSize,
          flexShrink: 0,
          display: 'inline-flex',
          verticalAlign: 'middle',
          ...(disableLink && { pointerEvents: 'none' }),
          ...sx,
        }}
        {...other}
      >
        {isSingle ? singleLogo : fullLogo}
      </Box>
    );
  }
);

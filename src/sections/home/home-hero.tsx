import type { MotionValue } from 'framer-motion';
import type { BoxProps } from '@mui/material/Box';

import { useRef, useState } from 'react';
import { m, useScroll, useSpring, useTransform, useMotionValueEvent } from 'framer-motion';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useResponsive } from 'src/hooks/use-responsive';

import { CONFIG } from 'src/config-global';
import { textGradient } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionContainer } from 'src/components/animate';

import { HeroBackground } from './components/hero-background';

// ----------------------------------------------------------------------

const smKey = 'sm';
const mdKey = 'md';
const lgKey = 'lg';

export function HomeHero({ sx, ...other }: BoxProps) {
  const theme = useTheme();

  const scroll = useScrollPercent();

  const mdUp = useResponsive('up', mdKey);

  const distance = mdUp ? scroll.percent : 0;

  const y1 = useTransformY(scroll.scrollY, distance * -7);
  const y2 = useTransformY(scroll.scrollY, distance * -6);
  const y3 = useTransformY(scroll.scrollY, distance * -5);
  const y4 = useTransformY(scroll.scrollY, distance * -4);
  const y5 = useTransformY(scroll.scrollY, distance * -3);

  const opacity: MotionValue<number> = useTransform(
    scroll.scrollY,
    [0, 1],
    [1, mdUp ? Number((1 - scroll.percent / 100).toFixed(1)) : 1]
  );

  const renderHeading = (
    <AnimatedDiv>
      <Box
        component="h1"
        display="flex"
        flexWrap="wrap"
        justifyContent="center"
        sx={{
          ...theme.typography.h2,
          my: 0,
          mx: 'auto',
          maxWidth: 680,
          fontFamily: theme.typography.fontSecondaryFamily,
          [theme.breakpoints.up(lgKey)]: { fontSize: 72, lineHeight: '90px' },
        }}
      >
        <Box component="span" sx={{ width: 1, opacity: 0.24 }}>
          ProEduc
        </Box>
        Gestão educacional
        <Box
          component={m.span}
          animate={{ backgroundPosition: '200% center' }}
          transition={{
            duration: 20,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          sx={{
            ...textGradient(
              `300deg, ${theme.vars.palette.primary.main} 0%, ${theme.vars.palette.warning.main} 25%, ${theme.vars.palette.primary.main} 50%, ${theme.vars.palette.warning.main} 75%, ${theme.vars.palette.primary.main} 100%`
            ),
            backgroundSize: '400%',
            ml: { xs: 0.75, md: 1, xl: 1.5 },
          }}
        >
          simples
        </Box>
      </Box>
    </AnimatedDiv>
  );

  const renderText = (
    <AnimatedDiv>
      <Typography
        variant="body2"
        sx={{
          mx: 'auto',
          [theme.breakpoints.up(smKey)]: { whiteSpace: 'pre' },
          [theme.breakpoints.up(lgKey)]: { fontSize: 20, lineHeight: '36px' },
        }}
      >
        {'Centralize alunos, turmas e rotinas administrativas em um só lugar.'}
      </Typography>
    </AnimatedDiv>
  );

  const renderRatings = (
    <AnimatedDiv>
      <Box
        gap={1.5}
        display="flex"
        flexWrap="wrap"
        alignItems="center"
        justifyContent="center"
        sx={{ typography: 'subtitle2' }}
      >
        Fácil de usar • Seguro • Feito para escolas
      </Box>
    </AnimatedDiv>
  );

  const renderButtons = (
    <Box display="flex" flexWrap="wrap" justifyContent="center" gap={{ xs: 1.5, sm: 2 }}>
      <AnimatedDiv>
        <Stack alignItems="center" spacing={2.5}>
          <Button
            component={RouterLink}
            href={paths.contact}
            color="inherit"
            size="large"
            variant="contained"
            startIcon={<Iconify width={24} icon="iconoir:flash" />}
          >
            Solicitar demonstração
          </Button>

          <Link
            color="inherit"
            variant="body2"
            component={RouterLink}
            href={CONFIG.auth.redirectPath}
            underline="always"
            sx={{ gap: 0.5, alignItems: 'center', display: 'inline-flex' }}
          >
            Acessar o sistema
            <Iconify width={16} icon="eva:arrow-forward-fill" />
          </Link>
        </Stack>
      </AnimatedDiv>

      <AnimatedDiv>
        <Button
          color="inherit"
          size="large"
          variant="outlined"
          component={RouterLink}
          href={paths.about}
          startIcon={<Iconify width={24} icon="solar:chat-round-dots-outline" />}
          sx={{ borderColor: 'text.primary' }}
        >
          Conhecer o ProEduc
        </Button>
      </AnimatedDiv>
    </Box>
  );

  const renderIcons = (
    <Stack spacing={3} sx={{ textAlign: 'center' }}>
      <AnimatedDiv>
        <Typography variant="overline" sx={{ opacity: 0.4 }}>
          Desenvolvido para
        </Typography>
      </AnimatedDiv>

      <Stack spacing={2.5} direction="row">
        {['Escolas', 'Gestão', 'Professores', 'Responsáveis', 'Alunos'].map((platform) => (
          <AnimatedDiv key={platform}>
            <Box
              component="span"
              sx={{
                px: 1.25,
                py: 0.5,
                borderRadius: 999,
                typography: 'caption',
                border: (t) => `1px solid ${t.vars.palette.divider}`,
                bgcolor: (t) => t.vars.palette.background.paper,
              }}
            >
              {platform}
            </Box>
          </AnimatedDiv>
        ))}
      </Stack>
    </Stack>
  );

  return (
    <Box
      ref={scroll.elementRef}
      component="section"
      sx={{
        overflow: 'hidden',
        position: 'relative',
        [theme.breakpoints.up(mdKey)]: {
          minHeight: 760,
          height: '100vh',
          maxHeight: 1440,
          display: 'block',
          willChange: 'opacity',
          mt: 'calc(var(--layout-header-desktop-height) * -1)',
        },
        ...sx,
      }}
      {...other}
    >
      <Box
        component={m.div}
        style={{ opacity }}
        sx={{
          width: 1,
          display: 'flex',
          position: 'relative',
          flexDirection: 'column',
          transition: theme.transitions.create(['opacity']),
          [theme.breakpoints.up(mdKey)]: { height: 1, position: 'fixed', maxHeight: 'inherit' },
        }}
      >
        <Container
          component={MotionContainer}
          sx={{
            py: 3,
            gap: 5,
            zIndex: 9,
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            [theme.breakpoints.up(mdKey)]: {
              flex: '1 1 auto',
              justifyContent: 'center',
              py: 'var(--layout-header-desktop-height)',
            },
          }}
        >
          <Stack spacing={3} sx={{ textAlign: 'center' }}>
            <m.div style={{ y: y1 }}>{renderHeading}</m.div>
            <m.div style={{ y: y2 }}>{renderText}</m.div>
          </Stack>
          <m.div style={{ y: y3 }}>{renderRatings}</m.div>
          <m.div style={{ y: y4 }}>{renderButtons}</m.div>
          <m.div style={{ y: y5 }}>{renderIcons}</m.div>
        </Container>

        <HeroBackground />
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

function AnimatedDiv({ children, component = m.div }: BoxProps & { children: React.ReactNode }) {
  return (
    <Box component={component} variants={varFade({ distance: 24 }).inUp}>
      {children}
    </Box>
  );
}

// ----------------------------------------------------------------------

function useTransformY(value: MotionValue<number>, distance: number) {
  const physics = {
    mass: 0.1,
    damping: 20,
    stiffness: 300,
    restDelta: 0.001,
  };

  return useSpring(useTransform(value, [0, 1], [0, distance]), physics);
}

function useScrollPercent() {
  const elementRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();

  const [percent, setPercent] = useState(0);

  useMotionValueEvent(scrollY, 'change', (scrollHeight) => {
    let heroHeight = 0;

    if (elementRef.current) {
      heroHeight = elementRef.current.offsetHeight;
    }

    const scrollPercent = Math.floor((scrollHeight / heroHeight) * 100);

    if (scrollPercent >= 100) {
      setPercent(100);
    } else {
      setPercent(Math.floor(scrollPercent));
    }
  });

  return { elementRef, percent, scrollY };
}

import type { BoxProps } from '@mui/material/Box';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';

import { Iconify } from 'src/components/iconify';
import { MotionViewport } from 'src/components/animate';

import { SectionTitle } from './components/section-title';
import { FloatLine, FloatPlusIcon } from './components/svg-elements';

// ----------------------------------------------------------------------

const FEATURES = [
  {
    icon: 'solar:users-group-rounded-bold-duotone',
    title: 'Gestão de alunos e turmas',
    desc: 'Organize cadastros, turmas e informações essenciais em um só lugar.',
  },
  {
    icon: 'solar:chat-round-dots-bold-duotone',
    title: 'Comunicação facilitada',
    desc: 'Melhore o fluxo de comunicação entre escola, alunos e responsáveis.',
  },
  {
    icon: 'solar:clipboard-check-bold-duotone',
    title: 'Rotina mais produtiva',
    desc: 'Ganhe tempo com processos claros e acompanhamento do dia a dia.',
  },
  {
    icon: 'solar:chart-2-bold-duotone',
    title: 'Relatórios e indicadores',
    desc: 'Tenha visibilidade para tomar decisões com mais segurança.',
  },
];

export function HomeHighlightFeatures({ sx, ...other }: BoxProps) {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        pt: { xs: 10, md: 14 },
        pb: { xs: 10, md: 14 },
        ...sx,
      }}
      {...other}
    >
      <MotionViewport>
        <FloatPlusIcon sx={{ top: 72, left: 72 }} />
        <FloatLine sx={{ top: 80, left: 0 }} />
        <FloatLine vertical sx={{ top: 0, left: 80 }} />
        <FloatLine sx={{ top: 64, right: 0, left: 'auto' }} />

        <Container>
          <Stack
            spacing={5}
            alignItems={{ xs: 'center', md: 'flex-start' }}
            sx={{ textAlign: { xs: 'center', md: 'left' } }}
          >
            <SectionTitle caption="ProEduc" title="Funcionalidades" txtGradient="features" />

            <Grid container spacing={3} sx={{ mt: { xs: 1, md: 2 } }}>
              {FEATURES.map((f) => (
                <Grid key={f.title} xs={12} md={6}>
                  <Stack
                    spacing={1.25}
                    sx={{
                      p: 3,
                      height: 1,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      border: (theme) => `1px solid ${theme.vars.palette.divider}`,
                      transition: (theme) => theme.transitions.create(['transform', 'box-shadow']),
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: (theme) => theme.customShadows?.z8,
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Iconify width={28} icon={f.icon} />
                      <Typography variant="h6">{f.title}</Typography>
                    </Stack>
                    <Typography sx={{ color: 'text.secondary' }}>{f.desc}</Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Container>
      </MotionViewport>
    </Box>
  );

}




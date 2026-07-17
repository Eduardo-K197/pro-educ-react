'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const FEATURES = [
  {
    icon: 'solar:users-group-rounded-bold-duotone',
    title: 'Gestão de Alunos',
    description: 'Cadastro completo, histórico financeiro, certificados e turmas em um só lugar.',
  },
  {
    icon: 'solar:wallet-money-bold-duotone',
    title: 'Financeiro Integrado',
    description: 'Boletos Sicredi, Cora e Asaas. Controle total de inadimplência e recebimentos.',
  },
  {
    icon: 'solar:book-2-bold-duotone',
    title: 'Cursos e Turmas',
    description: 'Monte grades curriculares, organize turmas e acompanhe o progresso dos alunos.',
  },
  {
    icon: 'solar:diploma-bold-duotone',
    title: 'Emissão de Certificados',
    description: 'Gere certificados em PDF com layout personalizado para cada escola.',
  },
  {
    icon: 'solar:buildings-2-bold-duotone',
    title: 'Multi-Escola',
    description: 'Gerencie várias unidades com administradores e configurações independentes.',
  },
  {
    icon: 'solar:chart-bold-duotone',
    title: 'Relatórios',
    description: 'Visão consolidada de inadimplência, matrículas e resultados financeiros.',
  },
];

export function LandingView() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          px: { xs: 2, md: 5 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="solar:book-bold" width={20} sx={{ color: 'white' }} />
          </Box>
          <Typography variant="h6" fontWeight={700} color="text.primary">
            Pro-Educ
          </Typography>
        </Stack>

        <Button
          variant="contained"
          component={RouterLink}
          href={paths.auth.jwt.signIn}
          startIcon={<Iconify icon="solar:login-bold-duotone" />}
        >
          Entrar
        </Button>
      </Box>

      {/* Hero */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: { xs: 8, md: 12 },
          px: 2,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            fontWeight={800}
            sx={{ mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}
          >
            Gestão educacional completa
          </Typography>
          <Typography
            variant="h6"
            fontWeight={400}
            sx={{ mb: 4, opacity: 0.88, maxWidth: 560, mx: 'auto' }}
          >
            Sistema integrado para escolas gerenciarem alunos, turmas, financeiro e certificados
            com agilidade.
          </Typography>
          <Button
            size="large"
            variant="contained"
            component={RouterLink}
            href={paths.auth.jwt.signIn}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              fontWeight: 700,
              px: 4,
              '&:hover': { bgcolor: 'grey.100' },
            }}
            startIcon={<Iconify icon="solar:login-bold-duotone" />}
          >
            Acessar o sistema
          </Button>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 1 }}>
          Tudo que sua escola precisa
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 6, maxWidth: 480, mx: 'auto' }}
        >
          Do financeiro às matrículas, o Pro-Educ centraliza a gestão da sua instituição.
        </Typography>

        <Grid container spacing={3}>
          {FEATURES.map((feat) => (
            <Grid key={feat.title} item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 'none',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: (t) => t.shadows[4] },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1.5,
                      bgcolor: 'primary.lighter',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    <Iconify icon={feat.icon} width={28} sx={{ color: 'primary.main' }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                    {feat.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feat.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA */}
      <Box
        sx={{
          bgcolor: 'background.neutral',
          py: { xs: 6, md: 8 },
          px: 2,
          textAlign: 'center',
          mt: 'auto',
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1.5 }}>
            Pronto para começar?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Acesse o painel administrativo e gerencie sua escola com eficiência.
          </Typography>
          <Button
            size="large"
            variant="contained"
            component={RouterLink}
            href={paths.auth.jwt.signIn}
            startIcon={<Iconify icon="solar:login-bold-duotone" />}
          >
            Entrar no sistema
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          textAlign: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="caption" color="text.disabled">
          © {new Date().getFullYear()} Pro-Educ · Sistema de Gestão Educacional
        </Typography>
      </Box>
    </Box>
  );
}
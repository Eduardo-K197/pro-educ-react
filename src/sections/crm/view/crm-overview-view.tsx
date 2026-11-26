'use client';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CRM_ROLE_LABELS } from 'src/types/services/crm';

import { CrmAccessGuard } from '../crm-access-guard';
import { useCrmAccess } from '../crm-access-context';
import { CrmConnectionStatus } from '../crm-connection-status';

// ----------------------------------------------------------------------

export function CrmOverviewView() {
  const { me, can } = useCrmAccess();

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="CRM"
        links={[{ name: 'Painel', href: paths.dashboard.root }, { name: 'CRM' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CrmAccessGuard min="agente">
        <Grid container spacing={3}>
          <Grid xs={12}>
            <CrmConnectionStatus />
          </Grid>

          <Grid xs={12} md={6}>
            <Card sx={{ p: 3, height: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Seu acesso
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                {me?.role && (
                  <Label variant="soft" color="primary">
                    {CRM_ROLE_LABELS[me.role]}
                  </Label>
                )}
                {me?.implicit && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    (administrador da escola)
                  </Typography>
                )}
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
                O atendimento por WhatsApp será habilitado nas próximas etapas. Por enquanto,
                configure os setores e a equipe que vai atender.
              </Typography>
            </Card>
          </Grid>

          {can('gestor') && (
            <Grid xs={12} md={6}>
              <Card sx={{ p: 3, height: 1 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Configuração
                </Typography>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.crm.departments}
                    variant="outlined"
                    startIcon={<Iconify icon="solar:case-round-bold-duotone" />}
                  >
                    Setores
                  </Button>
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.crm.members}
                    variant="outlined"
                    startIcon={<Iconify icon="solar:users-group-two-rounded-bold-duotone" />}
                  >
                    Membros
                  </Button>
                </Stack>
              </Card>
            </Grid>
          )}
        </Grid>
      </CrmAccessGuard>
    </DashboardContent>
  );
}

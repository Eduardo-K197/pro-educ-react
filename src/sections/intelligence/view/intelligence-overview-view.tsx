'use client';

import type { CrmRole } from 'src/types/services/crm';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CRM_ROLE_LABELS } from 'src/types/services/crm';
import { CRM_AI_MODULE_LABEL } from 'src/types/services/crm-ai';

import { CrmAccessGuard } from '../../crm/crm-access-guard';
import { useCrmAccess } from '../../crm/crm-access-context';

// ----------------------------------------------------------------------

const AREAS: { title: string; description: string; icon: string; href: string; min: CrmRole }[] = [
  {
    title: 'Autoatendimento',
    description: 'Liga a IA, define como ela age (observar, sugerir ou responder), a persona, as instruções e o teto de consumo.',
    icon: 'solar:settings-bold-duotone',
    href: paths.dashboard.intelligence.autoatendimento,
    min: 'gestor',
  },
  {
    title: 'Histórico',
    description: 'Cada decisão da IA: o que respondeu ou sugeriu, quando encaminhou para um atendente, tokens, custo e tempo.',
    icon: 'solar:history-bold-duotone',
    href: paths.dashboard.intelligence.historico,
    min: 'supervisor',
  },
  {
    title: 'Base de conhecimento',
    description: 'Perguntas frequentes, textos e arquivos (PDF/TXT) que a IA consulta para responder com informações da escola.',
    icon: 'solar:book-bookmark-bold-duotone',
    href: paths.dashboard.intelligence.conhecimento,
    min: 'gestor',
  },
];

export function IntelligenceOverviewView() {
  const { can } = useCrmAccess();

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={CRM_AI_MODULE_LABEL}
        links={[{ name: 'Painel', href: paths.dashboard.root }, { name: 'Intelligence' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CrmAccessGuard min="agente">
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          IA no atendimento do CRM: responde dúvidas frequentes pelo WhatsApp usando a base de conhecimento da escola e
          passa a conversa para a equipe quando necessário. Ative por canal em CRM › Canais.
        </Typography>

        <Grid container spacing={3}>
          {AREAS.map((area) => {
            const allowed = can(area.min);
            return (
              <Grid key={area.href} xs={12} md={4}>
                <Card sx={{ p: 3, height: 1, display: 'flex', flexDirection: 'column' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Iconify icon={area.icon} width={28} sx={{ color: 'primary.main' }} />
                    <Typography variant="subtitle1">{area.title}</Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1 }}>
                    {area.description}
                  </Typography>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {area.min === 'gestor' ? 'Somente gestor' : `${CRM_ROLE_LABELS[area.min]} ou acima`}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      component={RouterLink}
                      href={area.href}
                      disabled={!allowed}
                      endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
                    >
                      Abrir
                    </Button>
                  </Stack>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </CrmAccessGuard>
    </DashboardContent>
  );
}

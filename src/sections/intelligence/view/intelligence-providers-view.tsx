'use client';

import type { AiProvidersState } from 'src/types/services/ai-providers';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { AiProviderService } from 'src/services/ai-providers';

import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { AI_PURPOSES } from 'src/types/services/ai-providers';

import { AiProviderCard } from '../providers/ai-provider-card';
import { AiModelChainCard } from '../providers/ai-model-chain-card';

// ----------------------------------------------------------------------

/** SuperAdmin: provedores de IA da plataforma (chaves) e cadeia de modelos por finalidade. Global, sem escola. */
export function IntelligenceProvidersView() {
  const { user } = useAuthContext();
  const isSuperAdmin = user?.role === 'superAdmin';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Provedores de IA"
        links={[{ name: 'Painel', href: paths.dashboard.root }, { name: 'Provedores de IA' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      {isSuperAdmin ? (
        <ProvidersContent />
      ) : (
        <EmptyContent
          filled
          title="Acesso restrito"
          description="Somente o super admin da plataforma gerencia os provedores de IA."
          sx={{ py: 10 }}
        />
      )}
    </DashboardContent>
  );
}

function ProvidersContent() {
  const [state, setState] = useState<AiProvidersState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    AiProviderService.list()
      .then(setState)
      .catch((err) => setError(err?.message || 'Erro ao carregar os provedores de IA'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !state) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!state) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={load}>
            Tentar de novo
          </Button>
        }
      >
        {error ?? 'Erro ao carregar os provedores de IA'}
      </Alert>
    );
  }

  return (
    <Stack spacing={4}>
      <Alert severity="info">
        As chaves ficam cifradas no servidor e nunca são exibidas, só os últimos caracteres. Para
        cada provedor vale primeiro a chave salva aqui (banco) e, sem ela, a variável de ambiente
        dos servidores. As mudanças passam a valer em até ~30 s em todos os servidores.
      </Alert>

      <Stack spacing={2}>
        <Typography variant="h5">Chaves dos provedores</Typography>
        <Grid container spacing={3}>
          {state.providers.map((p) => (
            <Grid key={p.provider} xs={12} md={6} lg={4}>
              <AiProviderCard info={p} onChange={setState} />
            </Grid>
          ))}
        </Grid>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h5">Modelos por finalidade</Typography>
        {AI_PURPOSES.map((purpose) => (
          <AiModelChainCard
            key={purpose}
            purpose={purpose}
            rows={state.purposes?.[purpose] ?? []}
            providers={state.providers}
            onSaved={setState}
          />
        ))}
      </Stack>
    </Stack>
  );
}

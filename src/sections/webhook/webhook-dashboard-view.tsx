'use client';

import type { GetAllSchoolsWebhooksResponse } from 'src/types/services/asaas/webhook';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { WebhookService } from 'src/services/asaas/webhook';
import { DashboardContent } from 'src/layouts/dashboard';
import CircularProgress from '@mui/material/CircularProgress';

export function WebhookDashboardView() {
  const [data, setData] = useState<GetAllSchoolsWebhooksResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await WebhookService.listAll();
      setData(response);
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '60vh' }}>
          <CircularProgress />
        </Stack>
      </DashboardContent>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Dashboard de Webhooks</Typography>

      {/* Cards de Resumo */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total de Escolas
            </Typography>
            <Typography variant="h3">{data?.totalSchools}</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Processadas
            </Typography>
            <Typography variant="h3">{data?.processed}</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, bgcolor: (theme) => alpha(theme.palette.success.main, 0.08) }}>
            <Typography variant="subtitle2" color="text.secondary">
              Sucesso
            </Typography>
            <Typography variant="h3" color="success.main">
              {data?.ok}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, bgcolor: (theme) => alpha(theme.palette.error.main, 0.08) }}>
            <Typography variant="subtitle2" color="text.secondary">
              Falhas
            </Typography>
            <Typography variant="h3" color="error.main">
              {data?.failed}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Resumo por Status */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>
          Resumo por Status
        </Typography>
        <Stack direction="row" spacing={2}>
          <Chip label={`Ativos: ${data?.summary.ACTIVE}`} color="success" variant="outlined" />
          {data?.summary.INACTIVE && (
            <Chip label={`Inativos: ${data?.summary.INACTIVE}`} color="default" variant="outlined" />
          )}
          {data?.summary.UNKNOWN && (
            <Chip
              label={`Desconhecidos: ${data?.summary.UNKNOWN}`}
              color="warning"
              variant="outlined"
            />
          )}
        </Stack>
      </Card>

      {/* Lista de Escolas */}
      <Typography variant="h5">Webhooks por Escola</Typography>
      <Stack spacing={2}>
        {data?.items.map((school) => (
          <Card key={school.schoolId} sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Box>
                <Typography variant="h6">{school.schoolName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {school.count} webhook{school.count !== 1 ? 's' : ''}
                </Typography>
              </Box>
              <Chip
                label={school.status}
                color={school.status === 'ACTIVE' ? 'success' : 'default'}
                size="small"
              />
            </Stack>

            <Stack spacing={1}>
              {school.webhooks.map((webhook) => (
                <Box
                  key={webhook.id}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2">{webhook.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {webhook.email}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={webhook.enabled ? 'Habilitado' : 'Desabilitado'}
                        size="small"
                        color={webhook.enabled ? 'success' : 'default'}
                      />
                      {webhook.interrupted && (
                        <Chip label="Interrompido" size="small" color="warning" />
                      )}
                      <Chip
                        label={`${webhook.eventsCount} eventos`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}

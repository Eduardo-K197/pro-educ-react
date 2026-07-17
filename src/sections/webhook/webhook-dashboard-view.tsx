'use client';

import type { GetAllSchoolsWebhooksResponse, ISchoolWebhooks, IWebhookItem } from 'src/types/services/asaas/webhook';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { varAlpha } from 'src/theme/styles';

import { WebhookService } from 'src/services/asaas/webhook';
import { CoraService } from 'src/services/cora';
import { SicrediService } from 'src/services/sicredi';
import { DashboardContent } from 'src/layouts/dashboard';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

type StatusConfig = {
  label: string;
  color: 'success' | 'warning' | 'error' | 'default' | 'info';
};

const SCHOOL_STATUS: Record<string, StatusConfig> = {
  ACTIVE:        { label: 'Ativo',            color: 'success' },
  INACTIVE:      { label: 'Inativo',          color: 'default' },
  UNCONFIGURED:  { label: 'Não configurado',  color: 'warning' },
  UNKNOWN:       { label: 'Desconhecido',     color: 'error'   },
  NONE:          { label: 'Nenhum',           color: 'default' },
};

// ----------------------------------------------------------------------

function StatCard({
  title,
  value,
  icon,
  color = 'primary',
}: {
  title: string;
  value?: number;
  icon: string;
  color?: 'primary' | 'success' | 'error' | 'warning' | 'info';
}) {
  return (
    <Card
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flex: 1,
        minWidth: 160,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => varAlpha(theme.vars.palette[color].mainChannel, 0.12),
          color: `${color}.main`,
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} width={24} />
      </Box>
      <Box>
        <Typography variant="h4" lineHeight={1}>
          {value ?? '—'}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {title}
        </Typography>
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

function WebhookRow({
  webhook,
  onReactivate,
  reactivating,
}: {
  webhook: IWebhookItem;
  onReactivate: (id: string) => void;
  reactivating: boolean;
}) {
  const needsAction = !webhook.enabled || webhook.interrupted;

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 1,
        bgcolor: (theme) =>
          needsAction
            ? varAlpha(theme.vars.palette.warning.mainChannel, 0.04)
            : varAlpha(theme.vars.palette.grey['500Channel'], 0.04),
        border: (theme) =>
          `1px solid ${
            needsAction
              ? varAlpha(theme.vars.palette.warning.mainChannel, 0.2)
              : varAlpha(theme.vars.palette.grey['500Channel'], 0.12)
          }`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
        {/* Status dot */}
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: webhook.enabled && !webhook.interrupted ? 'success.main' : 'warning.main',
            flexShrink: 0,
          }}
        />

        {/* Name + URL */}
        <Box flex={1} minWidth={0}>
          <Typography variant="subtitle2" noWrap>
            {webhook.name || 'Webhook'}
          </Typography>
          {webhook.url && (
            <Typography variant="caption" color="text.disabled" noWrap>
              {webhook.url}
            </Typography>
          )}
        </Box>

        {/* Tags */}
        <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0} flexWrap="wrap">
          <Label
            variant="soft"
            color={webhook.enabled ? 'success' : 'default'}
            sx={{ fontSize: 11 }}
          >
            {webhook.enabled ? 'Habilitado' : 'Desabilitado'}
          </Label>

          {webhook.interrupted && (
            <Label variant="soft" color="warning" sx={{ fontSize: 11 }}>
              Interrompido
            </Label>
          )}

          <Chip
            size="small"
            variant="outlined"
            label={`${webhook.eventsCount} evento${webhook.eventsCount !== 1 ? 's' : ''}`}
            sx={{ height: 20, fontSize: 11 }}
          />

          {needsAction && (
            <LoadingButton
              size="small"
              variant="contained"
              color="warning"
              loading={reactivating}
              onClick={() => onReactivate(webhook.id)}
              startIcon={<Iconify icon="solar:restart-bold" width={14} />}
              sx={{ height: 26, fontSize: 11, px: 1 }}
            >
              Reativar
            </LoadingButton>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

function SchoolCard({
  school,
  onReactivate,
  reactivatingId,
}: {
  school: ISchoolWebhooks;
  onReactivate: (webhookId: string) => void;
  reactivatingId: string | null;
}) {
  const cfg = SCHOOL_STATUS[school.status] ?? { label: school.status, color: 'default' };

  return (
    <Card>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, py: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
              color: 'primary.main',
            }}
          >
            <Iconify icon="solar:buildings-bold-duotone" width={20} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {school.schoolName ?? 'Escola'}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {school.count} webhook{school.count !== 1 ? 's' : ''}
              {school.schoolId && ` · ID ${school.schoolId.slice(0, 8)}…`}
            </Typography>
            {school.sharedWith && school.sharedWith.length > 0 && (
              <Typography variant="caption" color="warning.main" display="block">
                Token compartilhado com: {school.sharedWith.join(', ')}
              </Typography>
            )}
          </Box>
        </Stack>

        <Label variant="soft" color={cfg.color}>
          {cfg.label}
        </Label>
      </Stack>

      {school.webhooks.length > 0 && (
        <>
          <Divider />
          <Stack spacing={1} sx={{ p: 2 }}>
            {school.webhooks.map((wh) => (
              <WebhookRow
                key={wh.id}
                webhook={wh}
                onReactivate={onReactivate}
                reactivating={reactivatingId === wh.id}
              />
            ))}
          </Stack>
        </>
      )}

      {school.webhooks.length === 0 && (
        <Box sx={{ px: 2.5, pb: 2 }}>
          {school.status === 'UNCONFIGURED' && (
            <Chip
              size="small"
              variant="outlined"
              label="Escola usa Cora ou Sicredi — sem webhook Asaas"
              sx={{ mb: 1, fontSize: 11 }}
            />
          )}
          <Typography variant="body2" color="text.disabled">
            Nenhum webhook encontrado para esta escola.
          </Typography>
        </Box>
      )}
    </Card>
  );
}

// ----------------------------------------------------------------------

export function WebhookDashboardView() {
  const [data, setData] = useState<GetAllSchoolsWebhooksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [pollingAll, setPollingAll] = useState(false);
  const [pollingSicredi, setPollingSicredi] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await WebhookService.listAll();
      setData(res);
    } catch {
      toast.error('Erro ao carregar webhooks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReactivate = useCallback(async (webhookId: string) => {
    setReactivatingId(webhookId);
    try {
      await WebhookService.enable(webhookId);
      toast.success('Webhook reativado com sucesso');
      await fetchData();
    } catch {
      toast.error('Erro ao reativar webhook');
    } finally {
      setReactivatingId(null);
    }
  }, [fetchData]);

  const handlePollAll = useCallback(async () => {
    setPollingAll(true);
    try {
      await CoraService.pollAll();
      toast.success('Polling Cora iniciado para todas as escolas');
    } catch {
      toast.error('Erro ao iniciar polling Cora');
    } finally {
      setPollingAll(false);
    }
  }, []);

  const handlePollSicredi = useCallback(async () => {
    setPollingSicredi(true);
    try {
      const res = await SicrediService.pollAll();
      toast.success(`Polling Sicredi concluído — ${res?.updated ?? 0} boleto(s) atualizado(s)`);
    } catch {
      toast.error('Erro ao executar polling Sicredi');
    } finally {
      setPollingSicredi(false);
    }
  }, []);

  if (loading) {
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '60vh' }}>
          <CircularProgress />
        </Stack>
      </DashboardContent>
    );
  }

  const summaryEntries = Object.entries(data?.summary ?? {}).filter(([, v]) => (v ?? 0) > 0);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Webhooks"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Webhooks' },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            <LoadingButton
              variant="soft"
              color="inherit"
              loading={pollingAll}
              onClick={handlePollAll}
              startIcon={<Iconify icon="solar:refresh-circle-bold" />}
            >
              Polling Cora
            </LoadingButton>
            <LoadingButton
              variant="soft"
              color="inherit"
              loading={pollingSicredi}
              onClick={handlePollSicredi}
              startIcon={<Iconify icon="solar:refresh-circle-bold" />}
            >
              Polling Sicredi
            </LoadingButton>
            <Tooltip title="Atualizar lista">
              <Button
                variant="contained"
                onClick={fetchData}
                startIcon={<Iconify icon="solar:refresh-bold" />}
              >
                Atualizar
              </Button>
            </Tooltip>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Stats */}
      <Stack direction="row" flexWrap="wrap" gap={2} mb={3}>
        <StatCard
          title="Total de escolas"
          value={data?.totalSchools}
          icon="solar:buildings-2-bold-duotone"
          color="primary"
        />
        <StatCard
          title="Processadas"
          value={data?.processed}
          icon="solar:check-circle-bold-duotone"
          color="info"
        />
        <StatCard
          title="Sucesso"
          value={data?.ok}
          icon="solar:verified-check-bold-duotone"
          color="success"
        />
        <StatCard
          title="Falhas"
          value={data?.failed}
          icon="solar:close-circle-bold-duotone"
          color="error"
        />
      </Stack>

      {/* Status summary chips */}
      {summaryEntries.length > 0 && (
        <Card sx={{ px: 2.5, py: 2, mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
            <Typography variant="subtitle2" color="text.secondary">
              Status:
            </Typography>
            {summaryEntries.map(([status, count]) => {
              const cfg = SCHOOL_STATUS[status] ?? { label: status, color: 'default' };
              return (
                <Label key={status} variant="soft" color={cfg.color}>
                  {cfg.label}: {count}
                </Label>
              );
            })}
          </Stack>
        </Card>
      )}

      {/* School list */}
      {(!data?.items || data.items.length === 0) ? (
        <Card sx={{ p: 4 }}>
          <Stack alignItems="center" spacing={1} color="text.disabled">
            <Iconify icon="solar:bell-off-bold-duotone" width={40} />
            <Typography variant="body2">Nenhuma escola com webhook configurado.</Typography>
          </Stack>
        </Card>
      ) : (
        <Stack spacing={2}>
          {data.items.map((school) => (
            <SchoolCard
              key={school.schoolId ?? school.schoolName}
              school={school}
              onReactivate={handleReactivate}
              reactivatingId={reactivatingId}
            />
          ))}
        </Stack>
      )}
    </DashboardContent>
  );
}

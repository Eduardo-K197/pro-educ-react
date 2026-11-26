'use client';

import type { CrmChannel, CrmDepartment, CrmChannelState, CrmChannelPayload } from 'src/types/services/crm';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Unstable_Grid2';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { CrmService } from 'src/services/crm';
import { useCrmSocketEvent } from 'src/lib/socket';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CRM_CHANNEL_STATE_LABELS } from 'src/types/services/crm';

import { CrmAccessGuard } from '../crm-access-guard';
import { CrmChannelFormDialog } from '../channels/crm-channel-form-dialog';
import { CrmChannelConnectDialog } from '../channels/crm-channel-connect-dialog';

// ----------------------------------------------------------------------

const STATE_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  connected: 'success',
  connecting: 'warning',
  qr_required: 'warning',
  error: 'error',
};

export function CrmChannelListView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Canais de atendimento"
        links={[{ name: 'CRM', href: paths.dashboard.crm.root }, { name: 'Canais' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <CrmAccessGuard min="gestor">
        <CrmChannelList />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

function CrmChannelList() {
  const [channels, setChannels] = useState<CrmChannel[]>([]);
  const [departments, setDepartments] = useState<CrmDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CrmChannel | null>(null);
  const [connecting, setConnecting] = useState<CrmChannel | null>(null);
  const [removing, setRemoving] = useState<CrmChannel | null>(null);
  const form = useBoolean();

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([CrmService.listChannels(), CrmService.listDepartments()])
      .then(([c, d]) => {
        setChannels(c);
        setDepartments(d);
      })
      .catch((err) => toast.error(err?.message || 'Erro ao carregar canais'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = useCallback((id: string, status: CrmChannelState, lastError?: string | null) => {
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, status, lastError: lastError ?? (status === 'error' ? c.lastError : null) } : c)));
  }, []);

  useCrmSocketEvent<{ channelId: string; state: CrmChannelState; detail?: string | null }>('crm:channel:status', (p) =>
    setStatus(p.channelId, p.state, p.detail)
  );

  const submit = async (payload: CrmChannelPayload) => {
    try {
      if (editing) await CrmService.updateChannel(editing.id, payload);
      else await CrmService.createChannel(payload);
      toast.success(editing ? 'Canal atualizado' : 'Canal criado');
      form.onFalse();
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar canal');
    }
  };

  const refresh = async (c: CrmChannel) => {
    try {
      const res = await CrmService.channelStatus(c.id);
      setStatus(c.id, res.status as CrmChannelState, res.detail);
      toast.info(`${CRM_CHANNEL_STATE_LABELS[res.status as CrmChannelState] ?? res.status}${res.detail ? ` — ${res.detail}` : ''}`);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao consultar status');
    }
  };

  const disconnect = async (c: CrmChannel, logout: boolean) => {
    try {
      const res = logout ? await CrmService.logoutChannel(c.id) : await CrmService.disconnectChannel(c.id);
      setStatus(c.id, res.status as CrmChannelState);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao desconectar');
    }
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => toast.success('Copiado'));
  };

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => {
            setEditing(null);
            form.onTrue();
          }}
        >
          Novo canal
        </Button>
      </Stack>

      {!loading && !channels.length && (
        <EmptyContent filled title="Nenhum canal" description="Cadastre o WhatsApp oficial (Meta) e/ou o não oficial (WAHA)." sx={{ py: 10 }} />
      )}

      <Grid container spacing={3}>
        {channels.map((c) => (
          <Grid key={c.id} xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Iconify icon="logos:whatsapp-icon" width={28} />
                <Typography variant="h6" sx={{ flex: 1 }} noWrap>
                  {c.name}
                </Typography>
                <Label color={STATE_COLOR[c.status] ?? 'default'}>{CRM_CHANNEL_STATE_LABELS[c.status] ?? c.status}</Label>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Label color={c.capabilities.official ? 'success' : 'default'} variant="soft">
                  {c.capabilities.official ? 'Oficial' : 'Não oficial'}
                </Label>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {c.providerName}
                </Typography>
              </Stack>
              {c.lastError && (
                <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mb: 1 }}>
                  {c.lastError}
                </Typography>
              )}
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', wordBreak: 'break-all' }}>
                  Webhook: {c.webhookUrl}
                </Typography>
                <Tooltip title="Copiar URL do webhook">
                  <IconButton size="small" onClick={() => copy(c.webhookUrl)}>
                    <Iconify icon="solar:copy-bold" width={16} />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {c.capabilities.qrPairing && (
                  <Button size="small" variant="contained" onClick={() => setConnecting(c)} startIcon={<Iconify icon="solar:qr-code-bold" />}>
                    {c.status === 'connected' ? 'Sessão' : 'Conectar'}
                  </Button>
                )}
                <Button size="small" variant="outlined" onClick={() => refresh(c)}>
                  Verificar status
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setEditing(c);
                    form.onTrue();
                  }}
                >
                  Editar
                </Button>
                {c.capabilities.qrPairing && c.status === 'connected' && (
                  <>
                    <Button size="small" color="warning" onClick={() => disconnect(c, false)}>
                      Parar
                    </Button>
                    <Button size="small" color="error" onClick={() => disconnect(c, true)}>
                      Desparear
                    </Button>
                  </>
                )}
                <Button size="small" color="error" onClick={() => setRemoving(c)}>
                  Remover
                </Button>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

      <CrmChannelFormDialog open={form.value} current={editing} departments={departments} onClose={form.onFalse} onSubmit={submit} />
      {connecting && (
        <CrmChannelConnectDialog
          open
          channel={connecting}
          onClose={() => setConnecting(null)}
          onStatus={(s) => setStatus(connecting.id, s)}
        />
      )}
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="Remover canal"
        content={`Remover "${removing?.name}"? A sessão no WhatsApp é encerrada, as conversas abertas são encerradas e o histórico é preservado.`}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              try {
                const res = await CrmService.deleteChannel(removing!.id);
                if (res?.providerWarning) toast.warning(res.providerWarning);
                toast.success(
                  res?.removed === 'soft'
                    ? `Canal removido; ${res.closedConversations} conversa(s) aberta(s) encerrada(s), histórico preservado`
                    : 'Canal removido'
                );
                setRemoving(null);
                load();
              } catch (err: any) {
                toast.error(err?.message || 'Erro ao remover');
              }
            }}
          >
            Remover
          </Button>
        }
      />
    </>
  );
}

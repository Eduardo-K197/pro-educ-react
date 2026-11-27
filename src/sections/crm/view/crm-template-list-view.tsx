'use client';

import type { CrmChannelSummary } from 'src/types/services/crm';
import type { CrmWaTemplate } from 'src/types/services/crm-campaign';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { hasCrmRole } from 'src/hooks/use-crm-permission';

import { fDateTime } from 'src/utils/format-time';

import { CrmService } from 'src/services/crm';
import { DashboardContent } from 'src/layouts/dashboard';
import { CrmCampaignService } from 'src/services/crm-campaign';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CRM_TEMPLATE_STATUS_LABELS, CRM_TEMPLATE_CATEGORY_LABELS } from 'src/types/services/crm-campaign';

import { CrmAccessGuard } from '../crm-access-guard';
import { useCrmAccess } from '../crm-access-context';
import { CrmTemplatePreview } from '../templates/crm-template-preview';

// ----------------------------------------------------------------------

export function templateStatusColor(status: string) {
  if (status === 'APPROVED') return 'success' as const;
  if (status === 'REJECTED' || status === 'DISABLED') return 'error' as const;
  if (status === 'PAUSED') return 'warning' as const;
  return 'default' as const;
}

export function CrmTemplateListView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Templates do WhatsApp"
        links={[{ name: 'CRM', href: paths.dashboard.crm.root }, { name: 'Templates' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <CrmAccessGuard min="agente">
        <TemplateList />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

function TemplateList() {
  const { me } = useCrmAccess();
  const canSync = hasCrmRole(me?.role, 'gestor');
  const [channels, setChannels] = useState<CrmChannelSummary[]>([]);
  const [channelId, setChannelId] = useState('');
  const [status, setStatus] = useState('');
  const [templates, setTemplates] = useState<CrmWaTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [preview, setPreview] = useState<CrmWaTemplate | null>(null);

  useEffect(() => {
    CrmService.listChannelSummary()
      .then((list) => {
        const official = list.filter((c) => c.official && c.templates);
        setChannels(official);
        if (official.length) setChannelId((current) => current || official[0].id);
      })
      .catch((err) => toast.error(err?.message || 'Erro ao carregar canais'));
  }, []);

  const load = useCallback(() => {
    if (!channelId) return;
    setLoading(true);
    CrmCampaignService.listTemplates({ channelId, status: status || undefined })
      .then(setTemplates)
      .catch((err) => toast.error(err?.message || 'Erro ao carregar templates'))
      .finally(() => setLoading(false));
  }, [channelId, status]);

  useEffect(() => {
    load();
  }, [load]);

  const sync = async () => {
    setSyncing(true);
    try {
      const res = await CrmCampaignService.syncTemplates(channelId);
      toast.success(`${res.synced} template(s) sincronizado(s)${res.removed ? `, ${res.removed} removido(s)` : ''}`);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao sincronizar templates');
    } finally {
      setSyncing(false);
    }
  };

  const lastSync = useMemo(
    () => templates.reduce<string | null>((acc, t) => (t.syncedAt && (!acc || t.syncedAt > acc) ? t.syncedAt : acc), null),
    [templates]
  );

  if (!channels.length) {
    return (
      <Alert severity="info">
        Templates só existem no canal oficial (WhatsApp Cloud API da Meta). Cadastre um canal Meta em CRM &gt; Canais
        informando o WABA ID para sincronizar os templates aprovados.
      </Alert>
    );
  }

  return (
    <Card>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ p: 2.5 }}>
        <TextField select size="small" label="Canal" value={channelId} onChange={(e) => setChannelId(e.target.value)} sx={{ minWidth: 220 }}>
          {channels.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">Todos</MenuItem>
          {Object.entries(CRM_TEMPLATE_STATUS_LABELS).map(([k, v]) => (
            <MenuItem key={k} value={k}>
              {v}
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>
          {lastSync ? `Última sincronização: ${fDateTime(lastSync)}` : 'Ainda não sincronizado'}
        </Typography>
        {canSync && (
          <LoadingButton
            variant="contained"
            loading={syncing}
            onClick={sync}
            startIcon={<Iconify icon="solar:refresh-bold" />}
            disabled={!channelId}
          >
            Sincronizar com a Meta
          </LoadingButton>
        )}
      </Stack>

      <TableContainer>
        <Scrollbar>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Idioma</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Variáveis</TableCell>
                <TableCell>Corpo</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{t.name}</TableCell>
                  <TableCell>{t.language}</TableCell>
                  <TableCell>{CRM_TEMPLATE_CATEGORY_LABELS[t.category ?? ''] ?? t.category ?? '-'}</TableCell>
                  <TableCell>
                    <Label color={templateStatusColor(t.status)}>{CRM_TEMPLATE_STATUS_LABELS[t.status] ?? t.status}</Label>
                    {t.rejectedReason && t.rejectedReason !== 'NONE' && (
                      <Typography variant="caption" sx={{ display: 'block', color: 'error.main' }}>
                        {t.rejectedReason}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{t.variables.length}</TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography variant="body2" noWrap>
                      {t.bodyText}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setPreview(t)} startIcon={<Iconify icon="solar:eye-bold" />}>
                      Visualizar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!templates.length && !loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    Nenhum template. {canSync ? 'Clique em "Sincronizar com a Meta".' : 'Peça a um gestor para sincronizar.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <Dialog open={!!preview} onClose={() => setPreview(null)} fullWidth maxWidth="xs">
        <DialogTitle>{preview?.name}</DialogTitle>
        <DialogContent>
          {preview && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1}>
                <Label>{preview.language}</Label>
                <Label>{CRM_TEMPLATE_CATEGORY_LABELS[preview.category ?? ''] ?? preview.category}</Label>
                <Label color={templateStatusColor(preview.status)}>
                  {CRM_TEMPLATE_STATUS_LABELS[preview.status] ?? preview.status}
                </Label>
              </Stack>
              <CrmTemplatePreview template={preview} />
              {preview.variables.length > 0 && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Variáveis: {preview.variables.join(', ')}
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreview(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

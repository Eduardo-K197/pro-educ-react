'use client';

import type { CrmCampaign, CrmRecipientStatus, CrmCampaignRecipient } from 'src/types/services/crm-campaign';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fNumber } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { CrmCampaignService } from 'src/services/crm-campaign';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import {
  CRM_AUDIENCE_LABELS,
  CRM_CAMPAIGN_STATUS_LABELS,
  CRM_RECIPIENT_STATUS_LABELS,
} from 'src/types/services/crm-campaign';

import { formatPhone } from '../inbox/utils';
import { CrmAccessGuard } from '../crm-access-guard';
import { campaignSent, campaignProgress, campaignStatusColor, recipientStatusColor } from '../campaigns/utils';

// ----------------------------------------------------------------------

export function CrmCampaignDetailsView({ id }: { id: string }) {
  return (
    <DashboardContent>
      <CrmAccessGuard min="supervisor">
        <CampaignDetails id={id} />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

function StatCard({ label, value, hint, color }: { label: string; value: number; hint?: string; color?: string }) {
  return (
    <Card sx={{ p: 2.5, height: 1 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ color }}>
        {fNumber(value)}
      </Typography>
      {hint && (
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {hint}
        </Typography>
      )}
    </Card>
  );
}

const pct = (part: number, total: number) => (total ? `${Math.round((part / total) * 100)}%` : '0%');

function CampaignDetails({ id }: { id: string }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<CrmCampaign | null>(null);
  const [busy, setBusy] = useState(false);
  const [recipients, setRecipients] = useState<CrmCampaignRecipient[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<CrmRecipientStatus | ''>('');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);

  const load = useCallback(() => {
    CrmCampaignService.get(id)
      .then(setCampaign)
      .catch((err) => toast.error(err?.message || 'Erro ao carregar campanha'));
  }, [id]);

  const loadRecipients = useCallback(() => {
    CrmCampaignService.recipients(id, { status, page: page + 1, perPage })
      .then((res) => {
        setRecipients(res.data);
        setTotal(res.total);
      })
      .catch((err) => toast.error(err?.message || 'Erro ao carregar destinatários'));
  }, [id, status, page, perPage]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadRecipients();
  }, [loadRecipients]);

  const live = campaign?.status === 'running' || campaign?.status === 'scheduled';
  useEffect(() => {
    if (!live) return undefined;
    const timer = setInterval(() => {
      load();
      loadRecipients();
    }, 10000);
    return () => clearInterval(timer);
  }, [live, load, loadRecipients]);

  const act = async (action: 'start' | 'pause' | 'resume' | 'cancel') => {
    if (action === 'cancel' && !window.confirm('Cancelar a campanha? Os destinatários ainda não enviados não receberão a mensagem.')) return;
    setBusy(true);
    try {
      setCampaign(await CrmCampaignService.action(id, action));
      loadRecipients();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao atualizar campanha');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Excluir esta campanha?')) return;
    try {
      await CrmCampaignService.remove(id);
      router.push(paths.dashboard.crm.campaigns);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao excluir campanha');
    }
  };

  const download = async () => {
    try {
      await CrmCampaignService.downloadReport(id);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao exportar relatório');
    }
  };

  if (!campaign) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 8 }} />;

  const { stats } = campaign;
  const sent = campaignSent(stats);
  const progress = campaignProgress(stats);

  const actions = (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {campaign.status === 'draft' && (
        <Button variant="contained" disabled={busy} onClick={() => act('start')} startIcon={<Iconify icon="solar:play-bold" />}>
          {campaign.scheduledAt && new Date(campaign.scheduledAt) > new Date() ? 'Agendar' : 'Iniciar envio'}
        </Button>
      )}
      {(campaign.status === 'running' || campaign.status === 'scheduled') && (
        <Button variant="outlined" color="warning" disabled={busy} onClick={() => act('pause')} startIcon={<Iconify icon="solar:pause-bold" />}>
          Pausar
        </Button>
      )}
      {campaign.status === 'paused' && (
        <Button variant="contained" disabled={busy} onClick={() => act('resume')} startIcon={<Iconify icon="solar:play-bold" />}>
          Retomar
        </Button>
      )}
      {['draft', 'scheduled', 'running', 'paused'].includes(campaign.status) && (
        <Button variant="outlined" color="error" disabled={busy} onClick={() => act('cancel')}>
          Cancelar
        </Button>
      )}
      {['draft', 'canceled', 'completed'].includes(campaign.status) && (
        <Button color="error" onClick={remove} startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}>
          Excluir
        </Button>
      )}
      <Button variant="outlined" onClick={download} startIcon={<Iconify icon="solar:download-bold" />}>
        Exportar CSV
      </Button>
    </Stack>
  );

  return (
    <>
      <CustomBreadcrumbs
        heading={campaign.name}
        links={[
          { name: 'CRM', href: paths.dashboard.crm.root },
          { name: 'Campanhas', href: paths.dashboard.crm.campaigns },
          { name: campaign.name },
        ]}
        action={actions}
        sx={{ mb: 3 }}
      />

      <Card sx={{ p: 2.5, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Label color={campaignStatusColor(campaign.status)}>{CRM_CAMPAIGN_STATUS_LABELS[campaign.status]}</Label>
              <Typography variant="body2">
                {campaign.channelName} · template <b>{campaign.templateName}</b> ({campaign.templateLanguage})
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Público: {campaign.audience ? CRM_AUDIENCE_LABELS[campaign.audience.type] : '-'} · Ritmo: {campaign.ratePerMinute}/min
              {campaign.createdByName ? ` · criada por ${campaign.createdByName}` : ''}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {campaign.scheduledAt && `Agendada: ${fDateTime(campaign.scheduledAt)} · `}
              {campaign.startedAt && `Início: ${fDateTime(campaign.startedAt)} · `}
              {campaign.finishedAt && `Fim: ${fDateTime(campaign.finishedAt)}`}
            </Typography>
          </Stack>
          <Box sx={{ minWidth: 240 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption">Progresso</Typography>
              <Typography variant="caption">{progress}%</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 1, mt: 0.5 }} />
          </Box>
        </Stack>
        {campaign.lastError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {campaign.lastError}
          </Alert>
        )}
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={6} sm={4} md={3}>
          <StatCard label="Destinatários" value={stats.total} hint={`${fNumber(stats.pending + stats.queued)} aguardando`} />
        </Grid>
        <Grid xs={6} sm={4} md={3}>
          <StatCard label="Enviadas" value={sent} hint={pct(sent, stats.total)} color="primary.main" />
        </Grid>
        <Grid xs={6} sm={4} md={2}>
          <StatCard label="Entregues" value={stats.delivered + stats.read + stats.replied} hint={pct(stats.delivered + stats.read + stats.replied, sent)} />
        </Grid>
        <Grid xs={6} sm={4} md={2}>
          <StatCard label="Lidas" value={stats.read + stats.replied} hint={pct(stats.read + stats.replied, sent)} color="success.main" />
        </Grid>
        <Grid xs={6} sm={4} md={2}>
          <StatCard label="Responderam" value={stats.replied} hint={pct(stats.replied, sent)} color="secondary.main" />
        </Grid>
        <Grid xs={6} sm={4} md={3}>
          <StatCard label="Falhas" value={stats.failed} color="error.main" />
        </Grid>
        <Grid xs={6} sm={4} md={3}>
          <StatCard label="Ignoradas (opt-out/inválidos)" value={stats.skipped} />
        </Grid>
      </Grid>

      <Card>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Destinatários
          </Typography>
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as CrmRecipientStatus | '');
              setPage(0);
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {(Object.keys(CRM_RECIPIENT_STATUS_LABELS) as CrmRecipientStatus[]).map((k) => (
              <MenuItem key={k} value={k}>
                {CRM_RECIPIENT_STATUS_LABELS[k]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <TableContainer>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Contato</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Variáveis</TableCell>
                  <TableCell>Enviada</TableCell>
                  <TableCell>Lida</TableCell>
                  <TableCell>Respondeu</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recipients.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Typography variant="body2">{r.name || '-'}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {formatPhone(r.phone)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Label color={recipientStatusColor(r.status)}>{CRM_RECIPIENT_STATUS_LABELS[r.status] ?? r.status}</Label>
                      {r.error && (
                        <Typography variant="caption" sx={{ display: 'block', color: 'error.main', maxWidth: 260 }}>
                          {r.error}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap component="div">
                        {Object.values(r.variables ?? {}).join(' · ')}
                      </Typography>
                    </TableCell>
                    <TableCell>{r.sentAt ? fDateTime(r.sentAt, 'DD/MM HH:mm') : '-'}</TableCell>
                    <TableCell>{r.readAt ? fDateTime(r.readAt, 'DD/MM HH:mm') : '-'}</TableCell>
                    <TableCell>{r.repliedAt ? fDateTime(r.repliedAt, 'DD/MM HH:mm') : '-'}</TableCell>
                  </TableRow>
                ))}
                {!recipients.length && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Nenhum destinatário neste filtro.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={perPage}
          rowsPerPageOptions={[25, 50, 100]}
          onPageChange={(_e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setPerPage(Number(e.target.value));
            setPage(0);
          }}
          labelRowsPerPage="Por página"
        />
      </Card>
    </>
  );
}

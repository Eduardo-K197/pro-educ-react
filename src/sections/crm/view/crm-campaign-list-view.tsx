'use client';

import type { CrmCampaign, CrmCampaignStatus } from 'src/types/services/crm-campaign';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { hasCrmRole } from 'src/hooks/use-crm-permission';

import { fNumber } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { CrmCampaignService } from 'src/services/crm-campaign';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CRM_CAMPAIGN_STATUS_LABELS } from 'src/types/services/crm-campaign';

import { CrmAccessGuard } from '../crm-access-guard';
import { useCrmAccess } from '../crm-access-context';
import { CrmCampaignCreateDialog } from '../campaigns/crm-campaign-create-dialog';
import { campaignSent, campaignProgress, campaignStatusColor } from '../campaigns/utils';

// ----------------------------------------------------------------------

export function CrmCampaignListView() {
  const create = useBoolean();
  const { me } = useCrmAccess();
  const canCreate = hasCrmRole(me?.role, 'supervisor');
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Campanhas"
        links={[{ name: 'CRM', href: paths.dashboard.crm.root }, { name: 'Campanhas' }]}
        action={
          canCreate && (
          <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={create.onTrue}>
            Nova campanha
          </Button>
          )
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <CrmAccessGuard min="supervisor">
        <CampaignList createOpen={create.value} onCloseCreate={create.onFalse} />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

function CampaignList({ createOpen, onCloseCreate }: { createOpen: boolean; onCloseCreate: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState<CrmCampaignStatus | ''>('');
  const [campaigns, setCampaigns] = useState<CrmCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    CrmCampaignService.list(status)
      .then((res) => setCampaigns(res.data))
      .catch((err) => toast.error(err?.message || 'Erro ao carregar campanhas'))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  // Atualiza enquanto houver campanha enviando/agendada.
  useEffect(() => {
    if (!campaigns.some((c) => c.status === 'running' || c.status === 'scheduled')) return undefined;
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [campaigns, load]);

  return (
    <Card>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2.5 }}>
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as CrmCampaignStatus | '')}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todas</MenuItem>
          {(Object.keys(CRM_CAMPAIGN_STATUS_LABELS) as CrmCampaignStatus[]).map((k) => (
            <MenuItem key={k} value={k}>
              {CRM_CAMPAIGN_STATUS_LABELS[k]}
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Campanhas saem só pelo canal oficial da Meta, com template aprovado.
        </Typography>
      </Stack>
      {loading && <LinearProgress sx={{ height: 2 }} />}
      <TableContainer>
        <Scrollbar>
          <Table size="small" sx={{ minWidth: 860 }}>
            <TableHead>
              <TableRow>
                <TableCell>Campanha</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Template</TableCell>
                <TableCell align="right">Destinatários</TableCell>
                <TableCell align="right">Enviadas</TableCell>
                <TableCell align="right">Lidas</TableCell>
                <TableCell align="right">Respostas</TableCell>
                <TableCell align="right">Falhas</TableCell>
                <TableCell sx={{ width: 140 }}>Progresso</TableCell>
                <TableCell>Quando</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.map((c) => {
                const progress = campaignProgress(c.stats);
                return (
                  <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(paths.dashboard.crm.campaign(c.id))}>
                    <TableCell>
                      <Typography variant="subtitle2">{c.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {c.channelName ?? ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Label color={campaignStatusColor(c.status)}>{CRM_CAMPAIGN_STATUS_LABELS[c.status]}</Label>
                    </TableCell>
                    <TableCell>{c.templateName}</TableCell>
                    <TableCell align="right">{fNumber(c.stats.total)}</TableCell>
                    <TableCell align="right">{fNumber(campaignSent(c.stats))}</TableCell>
                    <TableCell align="right">{fNumber(c.stats.read + c.stats.replied)}</TableCell>
                    <TableCell align="right">{fNumber(c.stats.replied)}</TableCell>
                    <TableCell align="right">{fNumber(c.stats.failed)}</TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LinearProgress variant="determinate" value={progress} sx={{ flex: 1 }} />
                        <Typography variant="caption">{progress}%</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {c.status === 'scheduled' && c.scheduledAt
                          ? `Agendada para ${fDateTime(c.scheduledAt)}`
                          : fDateTime(c.startedAt || c.createdAt)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!campaigns.length && !loading && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    Nenhuma campanha ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <CrmCampaignCreateDialog
        open={createOpen}
        onClose={onCloseCreate}
        onCreated={(c) => router.push(paths.dashboard.crm.campaign(c.id))}
      />
    </Card>
  );
}

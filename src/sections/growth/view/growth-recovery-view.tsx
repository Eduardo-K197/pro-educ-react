'use client';

import type { CrmDeal, GrowthRecovery } from 'src/types/services/crm-deal';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { GrowthService } from 'src/services/growth';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useCrmAccess } from 'src/sections/crm/crm-access-context';
import { CrmAccessGuard } from 'src/sections/crm/crm-access-guard';

import { daysSince } from '../components/deal-utils';
import { CrmTaskDialog } from '../components/task-dialog';

// ----------------------------------------------------------------------

export function GrowthRecoveryView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs heading="Recuperação de oportunidades" links={[{ name: 'Growth', href: paths.dashboard.growth.root }, { name: 'Recuperação' }]} sx={{ mb: 3 }} />
      <CrmAccessGuard min="agente">
        <Recovery />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

function lastActivity(d: CrmDeal) {
  const times = [d.lastInteractionAt, d.stageChangedAt, d.createdAt].filter(Boolean).map((t) => new Date(t as string).getTime());
  return new Date(Math.max(...times)).toISOString();
}

function Recovery() {
  const router = useRouter();
  const { can } = useCrmAccess();
  const [type, setType] = useState<'stalled' | 'lost'>('stalled');
  const [days, setDays] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<GrowthRecovery | null>(null);
  const [taskFor, setTaskFor] = useState<CrmDeal | null>(null);

  const load = useCallback(() => {
    // Sem dias escolhidos, a API usa o padrão da configuração e devolve o valor usado.
    GrowthService.recovery({ type, days: days || undefined, page, perPage: 25 })
      .then(setResult)
      .catch((err) => toast.error(err?.message || 'Erro ao carregar'));
  }, [type, page, days]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const reopen = async (deal: CrmDeal) => {
    try {
      await GrowthService.reopenDeal(deal.id);
      toast.success('Lead reaberto na primeira etapa do funil.');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível reabrir.');
    }
  };

  const rows = result?.data ?? [];

  return (
    <Card>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2} sx={{ px: 2, pt: 1 }}>
        <Tabs
          value={type}
          onChange={(_e, v) => {
            setType(v);
            setPage(1);
          }}
        >
          <Tab value="stalled" label="Parados" />
          <Tab value="lost" label="Perdidos" />
        </Tabs>
        {type === 'stalled' && (
          <TextField
            size="small"
            type="number"
            label="Sem atividade há (dias)"
            value={days || result?.days || ''}
            onChange={(e) => {
              setDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)));
              setPage(1);
            }}
            sx={{ width: 200 }}
          />
        )}
      </Stack>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Lead</TableCell>
              <TableCell>{type === 'lost' ? 'Motivo da perda' : 'Etapa'}</TableCell>
              <TableCell>Responsável</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell>{type === 'lost' ? 'Perdido em' : 'Última atividade'}</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((d) => {
              const idle = daysSince(lastActivity(d));
              return (
                <TableRow key={d.id} hover>
                  <TableCell sx={{ cursor: 'pointer' }} onClick={() => router.push(paths.dashboard.growth.lead(d.id))}>
                    <Typography variant="subtitle2">{d.title}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {[d.guardianName, d.guardianPhone, d.interestLabel].filter(Boolean).join(' · ')}
                    </Typography>
                  </TableCell>
                  <TableCell>{type === 'lost' ? d.lostReason ?? '—' : d.stage?.name ?? '—'}</TableCell>
                  <TableCell>{d.owner?.name ?? '—'}</TableCell>
                  <TableCell align="right">{d.estimatedValue != null ? fCurrency(d.estimatedValue) : '—'}</TableCell>
                  <TableCell>{type === 'lost' ? (d.lostAt ? fDate(d.lostAt) : '—') : `há ${idle ?? 0} dia(s)`}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => setTaskFor(d)}>
                        Criar tarefa
                      </Button>
                      {type === 'lost' && (
                        <Button size="small" variant="outlined" onClick={() => reopen(d)}>
                          Reabrir
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                  {type === 'stalled' ? 'Nenhum lead parado. Bom trabalho!' : 'Nenhum lead perdido.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={result?.total ?? 0}
        page={page - 1}
        rowsPerPage={25}
        rowsPerPageOptions={[25]}
        onPageChange={(_e, p) => setPage(p + 1)}
      />
      <CrmTaskDialog
        open={!!taskFor}
        dealId={taskFor?.id}
        defaultTitle={taskFor ? `Retomar contato: ${taskFor.title}` : undefined}
        onClose={() => setTaskFor(null)}
        onSaved={() => load()}
        canSupervise={can('supervisor')}
      />
    </Card>
  );
}

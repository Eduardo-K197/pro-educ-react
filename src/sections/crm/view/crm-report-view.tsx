'use client';

import type { CrmAgent, CrmDepartment, CrmChannelSummary } from 'src/types/services/crm';
import type { CrmReport, CrmReportGroup, CrmReportFilters } from 'src/types/services/crm-campaign';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { fNumber } from 'src/utils/format-number';

import { CrmService } from 'src/services/crm';
import { DashboardContent } from 'src/layouts/dashboard';
import { CrmCampaignService } from 'src/services/crm-campaign';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Chart, useChart } from 'src/components/chart';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CrmAccessGuard } from '../crm-access-guard';

// ----------------------------------------------------------------------

/** 3725 → "1h 2m"; 95 → "1m 35s". */
export function fDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return '-';
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function isoDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function CrmReportView() {
  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Relatórios do atendimento"
        links={[{ name: 'CRM', href: paths.dashboard.crm.root }, { name: 'Relatórios' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <CrmAccessGuard min="supervisor">
        <Report />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

function KpiCard({ title, value, hint, icon }: { title: string; value: string; hint?: string; icon: string }) {
  return (
    <Card sx={{ p: 2.5, height: 1 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Iconify icon={icon} width={36} sx={{ color: 'primary.main', flexShrink: 0 }} />
        <Stack sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {title}
          </Typography>
          <Typography variant="h5">{value}</Typography>
          {hint && (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {hint}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

function Report() {
  const theme = useTheme();
  const [filters, setFilters] = useState<CrmReportFilters>(() => {
    const to = new Date();
    const from = new Date(Date.now() - 29 * 86400_000);
    return { from: isoDate(from), to: isoDate(to) };
  });
  const [report, setReport] = useState<CrmReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [departments, setDepartments] = useState<CrmDepartment[]>([]);
  const [agents, setAgents] = useState<CrmAgent[]>([]);
  const [channels, setChannels] = useState<CrmChannelSummary[]>([]);

  useEffect(() => {
    CrmService.listDepartments().then(setDepartments).catch(() => setDepartments([]));
    CrmService.listAgents().then(setAgents).catch(() => setAgents([]));
    CrmService.listChannelSummary().then(setChannels).catch(() => setChannels([]));
  }, []);

  const load = useCallback(() => {
    if (!filters.from || !filters.to) return;
    setLoading(true);
    CrmCampaignService.report(filters)
      .then(setReport)
      .catch((err) => toast.error(err?.message || 'Erro ao carregar relatório'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      await CrmCampaignService.exportReport(filters);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao exportar');
    } finally {
      setExporting(false);
    }
  };

  const set = (patch: Partial<CrmReportFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const t = report?.totals;

  // Gráficos ---------------------------------------------------------------

  const dayOptions = useChart({
    xaxis: { categories: (report?.byDay ?? []).map((d) => `${d.date.slice(8, 10)  }/${  d.date.slice(5, 7)}`) },
    stroke: { width: 2 },
    tooltip: { shared: true, intersect: false },
    legend: { show: true },
  });

  const groupOptions = (groups: CrmReportGroup[]) => ({
    plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 2 } },
    xaxis: { categories: groups.map((g) => g.name || 'Sem nome') },
    legend: { show: true },
    tooltip: { shared: true, intersect: false },
  });
  const deptOptions = useChart(groupOptions(report?.byDepartment ?? []));
  const agentOptions = useChart(groupOptions((report?.byAgent ?? []).slice(0, 15)));

  const hourOptions = useChart({
    xaxis: { categories: Array.from({ length: 24 }, (_, h) => `${h}h`) },
    plotOptions: { bar: { columnWidth: '60%', borderRadius: 2 } },
  });

  const heatOptions = useChart({
    plotOptions: { heatmap: { radius: 2, shadeIntensity: 0.6, colorScale: { ranges: [{ from: 0, to: 0, color: theme.palette.grey[200] }] } } },
    colors: [theme.palette.primary.main],
    dataLabels: { enabled: false },
    xaxis: { type: 'category' },
    legend: { show: false },
  });

  const heatSeries = useMemo(
    () =>
      (report?.peakHours.byWeekdayHour ?? [])
        .map((row, day) => ({ name: WEEKDAYS[day], data: row.map((y, h) => ({ x: `${h}h`, y })) }))
        .reverse(),
    [report]
  );

  const donutOptions = useChart({
    labels: ['IA', 'Humano', 'Sem resposta'],
    colors: [theme.palette.secondary.main, theme.palette.primary.main, theme.palette.grey[400]],
    legend: { show: true, position: 'bottom' },
    stroke: { width: 0 },
    plotOptions: { pie: { donut: { size: '70%' } } },
  });

  return (
    <Stack spacing={3}>
      <Card sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} flexWrap="wrap" useFlexGap>
          <TextField
            type="date"
            size="small"
            label="De"
            value={filters.from}
            onChange={(e) => set({ from: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            size="small"
            label="Até"
            value={filters.to}
            onChange={(e) => set({ to: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField select size="small" label="Setor" value={filters.departmentId ?? ''} onChange={(e) => set({ departmentId: e.target.value })} sx={{ minWidth: 160 }}>
            <MenuItem value="">Todos</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Agente" value={filters.userId ?? ''} onChange={(e) => set({ userId: e.target.value })} sx={{ minWidth: 180 }}>
            <MenuItem value="">Todos</MenuItem>
            {agents.map((a) => (
              <MenuItem key={`${a.userType}:${a.userId}`} value={a.userId}>
                {a.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Canal" value={filters.channelId ?? ''} onChange={(e) => set({ channelId: e.target.value })} sx={{ minWidth: 160 }}>
            <MenuItem value="">Todos</MenuItem>
            {channels.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" sx={{ flex: 1 }} justifyContent="flex-end">
            <LoadingButton variant="outlined" loading={exporting} onClick={exportCsv} startIcon={<Iconify icon="solar:download-bold" />}>
              Exportar CSV
            </LoadingButton>
          </Stack>
        </Stack>
      </Card>

      {loading && <LinearProgress sx={{ height: 2 }} />}

      {report && t && (
        <>
          <Grid container spacing={2}>
            <Grid xs={12} sm={6} md={4} lg={2}>
              <KpiCard
                title="Conversas"
                value={fNumber(t.conversations)}
                hint={`${fNumber(t.closed)} encerradas · ${fNumber(t.open + t.pending)} em aberto`}
                icon="solar:chat-round-dots-bold-duotone"
              />
            </Grid>
            <Grid xs={12} sm={6} md={4} lg={2}>
              <KpiCard
                title="1ª resposta (média)"
                value={fDuration(t.firstResponse.avgSec)}
                hint={`p90: ${fDuration(t.firstResponse.p90Sec)}`}
                icon="solar:stopwatch-bold-duotone"
              />
            </Grid>
            <Grid xs={12} sm={6} md={4} lg={2}>
              <KpiCard
                title="Resolução (média)"
                value={fDuration(t.resolution.avgSec)}
                hint={`p90: ${fDuration(t.resolution.p90Sec)}`}
                icon="solar:check-circle-bold-duotone"
              />
            </Grid>
            <Grid xs={12} sm={6} md={4} lg={2}>
              <KpiCard
                title="Avaliação média"
                value={t.rating.avg !== null ? `${t.rating.avg.toFixed(1)} ★` : '-'}
                hint={`${fNumber(t.rating.count)} avaliação(ões)`}
                icon="solar:star-bold-duotone"
              />
            </Grid>
            <Grid xs={12} sm={6} md={4} lg={2}>
              <KpiCard
                title="Resolvidas pela IA"
                value={`${Math.round(t.resolvedBy.aiPct)}%`}
                hint={`${fNumber(t.resolvedBy.ai)} conversa(s)`}
                icon="solar:stars-bold-duotone"
              />
            </Grid>
            <Grid xs={12} sm={6} md={4} lg={2}>
              <KpiCard
                title="Resolvidas por humano"
                value={`${Math.round(t.resolvedBy.humanPct)}%`}
                hint={`${fNumber(t.resolvedBy.human)} conversa(s)`}
                icon="solar:user-check-bold-duotone"
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid xs={12} md={8}>
              <Card>
                <CardHeader title="Volume de conversas por dia" />
                <Chart
                  type="area"
                  series={[
                    { name: 'Novas', data: report.byDay.map((d) => d.conversations) },
                    { name: 'Encerradas', data: report.byDay.map((d) => d.closed) },
                  ]}
                  options={dayOptions}
                  height={320}
                  sx={{ p: 2 }}
                />
              </Card>
            </Grid>
            <Grid xs={12} md={4}>
              <Card sx={{ height: 1 }}>
                <CardHeader title="IA x humano" subheader="Conversas encerradas" />
                <Chart
                  type="donut"
                  series={[t.resolvedBy.ai, t.resolvedBy.human, t.resolvedBy.none]}
                  options={donutOptions}
                  height={300}
                  sx={{ p: 2 }}
                />
              </Card>
            </Grid>

            <Grid xs={12} md={6}>
              <Card>
                <CardHeader title="Conversas por setor" />
                <Chart
                  type="bar"
                  series={[
                    { name: 'Conversas', data: report.byDepartment.map((g) => g.conversations) },
                    { name: 'Encerradas', data: report.byDepartment.map((g) => g.closed) },
                  ]}
                  options={deptOptions}
                  height={Math.max(220, report.byDepartment.length * 44)}
                  sx={{ p: 2 }}
                />
              </Card>
            </Grid>
            <Grid xs={12} md={6}>
              <Card>
                <CardHeader title="Conversas por agente" subheader={report.byAgent.length > 15 ? 'Top 15' : undefined} />
                <Chart
                  type="bar"
                  series={[
                    { name: 'Conversas', data: report.byAgent.slice(0, 15).map((g) => g.conversations) },
                    { name: 'Encerradas', data: report.byAgent.slice(0, 15).map((g) => g.closed) },
                  ]}
                  options={agentOptions}
                  height={Math.max(220, Math.min(15, report.byAgent.length) * 44)}
                  sx={{ p: 2 }}
                />
              </Card>
            </Grid>

            <Grid xs={12} md={5}>
              <Card>
                <CardHeader title="Horário de pico" subheader="Conversas iniciadas por hora" />
                <Chart
                  type="bar"
                  series={[{ name: 'Conversas', data: report.peakHours.byHour }]}
                  options={hourOptions}
                  height={300}
                  sx={{ p: 2 }}
                />
              </Card>
            </Grid>
            <Grid xs={12} md={7}>
              <Card>
                <CardHeader title="Dia da semana x hora" />
                <Chart type="heatmap" series={heatSeries} options={heatOptions} height={300} sx={{ p: 2 }} />
              </Card>
            </Grid>
          </Grid>

          <GroupTable title="Desempenho por agente" rows={report.byAgent} />
          <GroupTable title="Desempenho por setor" rows={report.byDepartment} />
          <GroupTable title="Desempenho por canal" rows={report.byChannel} />
        </>
      )}
    </Stack>
  );
}

function GroupTable({ title, rows }: { title: string; rows: CrmReportGroup[] }) {
  return (
    <Card>
      <CardHeader title={title} sx={{ mb: 1 }} />
      <TableContainer>
        <Scrollbar>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell align="right">Conversas</TableCell>
                <TableCell align="right">Encerradas</TableCell>
                <TableCell align="right">1ª resposta (média)</TableCell>
                <TableCell align="right">1ª resposta (p90)</TableCell>
                <TableCell align="right">Resolução (média)</TableCell>
                <TableCell align="right">Avaliação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id ?? 'none'}>
                  <TableCell>{r.name || 'Sem atribuição'}</TableCell>
                  <TableCell align="right">{fNumber(r.conversations)}</TableCell>
                  <TableCell align="right">{fNumber(r.closed)}</TableCell>
                  <TableCell align="right">{fDuration(r.avgFirstResponseSec)}</TableCell>
                  <TableCell align="right">{fDuration(r.p90FirstResponseSec)}</TableCell>
                  <TableCell align="right">{fDuration(r.avgResolutionSec)}</TableCell>
                  <TableCell align="right">{r.avgRating !== null ? r.avgRating.toFixed(1) : '-'}</TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    Sem dados no período.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    </Card>
  );
}

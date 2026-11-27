'use client';

import type { CrmAiRun, CrmAiMode, CrmAiDecision, CrmAiRunFilters } from 'src/types/services/crm-ai';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import { CrmAiService } from 'src/services/crm-ai';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableNoData, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import {
  CRM_AI_MODE_LABELS,
  CRM_AI_PURPOSE_LABELS,
  CRM_AI_DECISION_LABELS,
  CRM_AI_DECISION_COLORS,
} from 'src/types/services/crm-ai';

import { fInt, fUsd, fLatency } from '../utils';
import { CrmAccessGuard } from '../../crm/crm-access-guard';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'expand', width: 48 },
  { id: 'createdAt', label: 'Data', width: 140 },
  { id: 'decision', label: 'Decisão', width: 120 },
  { id: 'reason', label: 'Motivo' },
  { id: 'purpose', label: 'Finalidade', width: 110 },
  { id: 'model', label: 'Modelo', width: 160 },
  { id: 'tokens', label: 'Tokens in/out', width: 130, align: 'right' },
  { id: 'cost', label: 'Custo', width: 110, align: 'right' },
  { id: 'latency', label: 'Latência', width: 100, align: 'right' },
];

type Filters = {
  decision: CrmAiDecision | '';
  mode: CrmAiMode | '';
  from: string;
  to: string;
  conversationId: string;
};

const EMPTY_FILTERS: Filters = { decision: '', mode: '', from: '', to: '', conversationId: '' };

export function IntelligenceRunListView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Histórico da IA"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Intelligence', href: paths.dashboard.intelligence.root },
          { name: 'Histórico' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <CrmAccessGuard min="supervisor">
        <RunList />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

function RunList() {
  const table = useTable({ defaultRowsPerPage: 30, defaultOrderBy: 'createdAt', defaultOrder: 'desc' });
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [conversationId, setConversationId] = useState('');
  const [rows, setRows] = useState<CrmAiRun[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { page, rowsPerPage, onResetPage } = table;

  // Debounce do id da conversa (campo de texto livre).
  useEffect(() => {
    const t = setTimeout(() => setConversationId(filters.conversationId.trim()), 400);
    return () => clearTimeout(t);
  }, [filters.conversationId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const query: CrmAiRunFilters = {
      decision: filters.decision || undefined,
      mode: filters.mode || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      conversationId: conversationId || undefined,
      page: page + 1,
      perPage: rowsPerPage,
    };
    CrmAiService.listRuns(query)
      .then((res) => {
        if (cancelled) return;
        setRows(res.items);
        setTotal(res.total);
      })
      .catch((err) => !cancelled && toast.error(err?.message || 'Erro ao carregar o histórico da IA'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters.decision, filters.mode, filters.from, filters.to, conversationId, page, rowsPerPage]);

  const set = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    onResetPage();
  };

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <Card>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2.5 }} alignItems={{ md: 'center' }}>
        <TextField
          select
          size="small"
          label="Decisão"
          value={filters.decision}
          onChange={(e) => set({ decision: e.target.value as Filters['decision'] })}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Todas</MenuItem>
          {(Object.keys(CRM_AI_DECISION_LABELS) as CrmAiDecision[]).map((d) => (
            <MenuItem key={d} value={d}>
              {CRM_AI_DECISION_LABELS[d]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Modo"
          value={filters.mode}
          onChange={(e) => set({ mode: e.target.value as Filters['mode'] })}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {(Object.keys(CRM_AI_MODE_LABELS) as CrmAiMode[]).map((m) => (
            <MenuItem key={m} value={m}>
              {CRM_AI_MODE_LABELS[m]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          type="date"
          label="De"
          value={filters.from}
          onChange={(e) => set({ from: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          size="small"
          type="date"
          label="Até"
          value={filters.to}
          onChange={(e) => set({ to: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          size="small"
          label="Conversa (ID)"
          value={filters.conversationId}
          onChange={(e) => set({ conversationId: e.target.value })}
          sx={{ flex: 1, minWidth: 180 }}
        />
        {hasFilters && (
          <Button color="error" onClick={() => set(EMPTY_FILTERS)} startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}>
            Limpar
          </Button>
        )}
      </Stack>

      <Divider />
      <Box sx={{ height: 2 }}>{loading && <LinearProgress sx={{ height: 2 }} />}</Box>

      <Scrollbar>
        <TableContainer sx={{ minWidth: 1000 }}>
          <Table size="small">
            <TableHeadCustom headLabel={TABLE_HEAD} />
            <TableBody>
              {rows.map((row) => (
                <RunRow
                  key={row.id}
                  row={row}
                  open={expanded === row.id}
                  onToggle={() => setExpanded((id) => (id === row.id ? null : row.id))}
                />
              ))}
              <TableNoData
                notFound={!loading && rows.length === 0}
                title="Nenhuma execução da IA"
                description={hasFilters ? 'Nada encontrado com esses filtros.' : 'As decisões da IA aparecem aqui assim que ela começar a atender.'}
              />
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>

      <TablePaginationCustom
        count={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={table.onChangePage}
        onRowsPerPageChange={table.onChangeRowsPerPage}
        rowsPerPageOptions={[30, 50, 100]}
      />
    </Card>
  );
}

// ----------------------------------------------------------------------

function RunRow({ row, open, onToggle }: { row: CrmAiRun; open: boolean; onToggle: () => void }) {
  const hasDetails = !!row.suggestedText || !!row.citations?.length || !!row.reason || !!row.conversationId;

  return (
    <>
      <TableRow hover sx={{ '& > td': { borderBottom: open ? 'none' : undefined } }}>
        <TableCell padding="checkbox">
          <IconButton size="small" onClick={onToggle} disabled={!hasDetails}>
            <Iconify icon={open ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'} />
          </IconButton>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography variant="body2">{fDateTime(row.createdAt, 'DD/MM/YYYY')}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {fDateTime(row.createdAt, 'HH:mm:ss')} · {CRM_AI_MODE_LABELS[row.mode as CrmAiMode] ?? row.mode}
          </Typography>
        </TableCell>
        <TableCell>
          <Label variant="soft" color={CRM_AI_DECISION_COLORS[row.decision] ?? 'default'}>
            {CRM_AI_DECISION_LABELS[row.decision] ?? row.decision}
          </Label>
        </TableCell>
        <TableCell sx={{ maxWidth: 320 }}>
          <Typography variant="body2" noWrap title={row.reason ?? undefined}>
            {row.reason || '—'}
          </Typography>
        </TableCell>
        <TableCell>{row.purpose ? CRM_AI_PURPOSE_LABELS[row.purpose] ?? row.purpose : '—'}</TableCell>
        <TableCell>
          <Tooltip title={row.provider}>
            <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
              {row.model}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
          {fInt(row.tokensIn)} / {fInt(row.tokensOut)}
        </TableCell>
        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
          {fUsd(row.costUsd)}
        </TableCell>
        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
          {fLatency(row.latencyMs)}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={TABLE_HEAD.length} sx={{ py: 0, ...(open ? {} : { borderBottom: 'none' }) }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Stack spacing={2} sx={{ py: 2, px: 1 }}>
              {row.reason && (
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">Motivo</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {row.reason}
                  </Typography>
                </Stack>
              )}
              <Stack spacing={0.5}>
                <Typography variant="subtitle2">Texto sugerido</Typography>
                {row.suggestedText ? (
                  <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {row.suggestedText}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    Sem texto nesta execução.
                  </Typography>
                )}
              </Stack>
              {!!row.citations?.length && (
                <Stack spacing={0.75}>
                  <Typography variant="subtitle2">Fontes consultadas</Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    {row.citations.map((c) => (
                      <Chip
                        key={c.chunkId}
                        size="small"
                        variant="soft"
                        icon={<Iconify icon="solar:document-text-bold" width={16} />}
                        label={c.title}
                      />
                    ))}
                  </Stack>
                </Stack>
              )}
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {row.conversationId && (
                  <Link
                    component={RouterLink}
                    href={`${paths.dashboard.crm.inbox}?id=${row.conversationId}`}
                    variant="body2"
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <Iconify icon="solar:chat-round-dots-bold" width={16} />
                    Abrir conversa
                  </Link>
                )}
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Execução {row.id} · {row.useCase} · {row.provider}
                </Typography>
              </Stack>
            </Stack>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

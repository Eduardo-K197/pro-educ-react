'use client';

import type { CrmTag } from 'src/types/services/crm';
import type { CrmDeal, CrmPipeline, CrmDealFilters, CrmDealSocketPayload } from 'src/types/services/crm-deal';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { CrmService } from 'src/services/crm';
import { useCrmSocketEvent } from 'src/lib/socket';
import { GrowthService } from 'src/services/growth';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CrmAccessGuard } from 'src/sections/crm/crm-access-guard';
import { useCrmAccess } from 'src/sections/crm/crm-access-context';

import { isDeletedDeal, CRM_DEAL_SOURCES, CRM_DEAL_SOURCE_LABELS, CRM_DEAL_STATUS_LABELS } from 'src/types/services/crm-deal';

import { daysSince, upsertDeal } from '../components/deal-utils';
import { CrmDealFormDialog } from '../components/deal-form-dialog';

// ----------------------------------------------------------------------

export function GrowthLeadListView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs heading="Leads" links={[{ name: 'Growth', href: paths.dashboard.growth.root }, { name: 'Leads' }]} sx={{ mb: { xs: 3, md: 5 } }} />
      <CrmAccessGuard min="agente">
        <LeadList />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

const STATUS_COLOR = { open: 'info', won: 'success', lost: 'error' } as const;

function LeadList() {
  const router = useRouter();
  const { can } = useCrmAccess();
  const canSupervise = can('supervisor');
  const [filters, setFilters] = useState<CrmDealFilters>({ status: 'open', page: 1, perPage: 25 });
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<CrmDeal[]>([]);
  const [total, setTotal] = useState(0);
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [tags, setTags] = useState<CrmTag[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    GrowthService.listPipelines()
      .then(setPipelines)
      .catch(() => setPipelines([]));
    CrmService.listTags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  const load = useCallback(() => {
    GrowthService.listDeals({ ...filters, search: search.trim() || undefined })
      .then((res) => {
        setRows(res.data);
        setTotal(res.total);
      })
      .catch((err) => toast.error(err?.message || 'Erro ao carregar leads'));
  }, [filters, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  useCrmSocketEvent<CrmDealSocketPayload>('crm:deal:updated', ({ deal }) => {
    if (isDeletedDeal(deal)) setRows((list) => list.filter((d) => d.id !== deal.id));
    else setRows((list) => (list.some((d) => d.id === deal.id) ? upsertDeal(list, deal) : list));
  });

  const set = (key: keyof CrmDealFilters) => (e: React.ChangeEvent<HTMLInputElement>) => setFilters((f) => ({ ...f, [key]: e.target.value || undefined, page: 1 }));

  const stageFilterOptions = pipelines.find((p) => p.id === filters.pipelineId)?.stages ?? (pipelines.length === 1 ? pipelines[0].stages : []);

  return (
    <Card>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ p: 2 }} flexWrap="wrap" useFlexGap>
        <TextField
          size="small"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setFilters((f) => ({ ...f, page: 1 }));
          }}
          sx={{ minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" />
              </InputAdornment>
            ),
          }}
        />
        <TextField select size="small" label="Situação" value={filters.status ?? ''} onChange={set('status')} sx={{ minWidth: 140 }}>
          <MenuItem value="">Todas</MenuItem>
          <MenuItem value="open">Em andamento</MenuItem>
          <MenuItem value="won">Ganhos</MenuItem>
          <MenuItem value="lost">Perdidos</MenuItem>
        </TextField>
        {pipelines.length > 1 && (
          <TextField select size="small" label="Funil" value={filters.pipelineId ?? ''} onChange={set('pipelineId')} sx={{ minWidth: 150 }}>
            <MenuItem value="">Todos</MenuItem>
            {pipelines.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
        )}
        {!!stageFilterOptions.length && (
          <TextField select size="small" label="Etapa" value={filters.stageId ?? ''} onChange={set('stageId')} sx={{ minWidth: 170 }}>
            <MenuItem value="">Todas</MenuItem>
            {stageFilterOptions.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
        )}
        <TextField select size="small" label="Origem" value={filters.source ?? ''} onChange={set('source')} sx={{ minWidth: 140 }}>
          <MenuItem value="">Todas</MenuItem>
          {CRM_DEAL_SOURCES.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </TextField>
        {!!tags.length && (
          <TextField select size="small" label="Tag" value={filters.tagId ?? ''} onChange={set('tagId')} sx={{ minWidth: 130 }}>
            <MenuItem value="">Todas</MenuItem>
            {tags.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
        )}
        {canSupervise && (
          <TextField select size="small" label="Responsável" value={filters.owner ?? ''} onChange={set('owner')} sx={{ minWidth: 150 }}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="me">Meus leads</MenuItem>
            <MenuItem value="none">Sem responsável</MenuItem>
          </TextField>
        )}
        <TextField size="small" type="date" label="Criado de" value={filters.createdFrom ?? ''} onChange={set('createdFrom')} InputLabelProps={{ shrink: true }} />
        <TextField size="small" type="date" label="até" value={filters.createdTo ?? ''} onChange={set('createdTo')} InputLabelProps={{ shrink: true }} />
        <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={() => setCreating(true)} sx={{ ml: { md: 'auto' } }}>
          Novo lead
        </Button>
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Lead</TableCell>
              <TableCell>Etapa</TableCell>
              <TableCell>Responsável</TableCell>
              <TableCell>Origem</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell>Última interação</TableCell>
              <TableCell>Criado em</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((d) => {
              const idle = daysSince(d.lastInteractionAt);
              return (
                <TableRow key={d.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(paths.dashboard.growth.lead(d.id))}>
                  <TableCell>
                    <Typography variant="subtitle2">{d.title}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {[d.guardianName, d.interestLabel].filter(Boolean).join(' · ')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Label variant="soft" color={STATUS_COLOR[d.status]}>
                        {d.status === 'open' ? d.stage?.name ?? '—' : CRM_DEAL_STATUS_LABELS[d.status]}
                      </Label>
                    </Stack>
                  </TableCell>
                  <TableCell>{d.owner?.name ?? '—'}</TableCell>
                  <TableCell>{d.source ? CRM_DEAL_SOURCE_LABELS[d.source] ?? d.source : '—'}</TableCell>
                  <TableCell align="right">{d.estimatedValue != null ? fCurrency(d.estimatedValue) : '—'}</TableCell>
                  <TableCell>{idle === null ? '—' : idle === 0 ? 'Hoje' : `há ${idle} dia(s)`}</TableCell>
                  <TableCell>{fDate(d.createdAt)}</TableCell>
                </TableRow>
              );
            })}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                  Nenhum lead encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={(filters.page ?? 1) - 1}
        rowsPerPage={filters.perPage ?? 25}
        rowsPerPageOptions={[25, 50, 100]}
        onPageChange={(_e, page) => setFilters((f) => ({ ...f, page: page + 1 }))}
        onRowsPerPageChange={(e) => setFilters((f) => ({ ...f, perPage: Number(e.target.value), page: 1 }))}
        labelRowsPerPage="Por página"
      />

      <CrmDealFormDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(deal) => router.push(paths.dashboard.growth.lead(deal.id))}
        canSupervise={canSupervise}
      />
    </Card>
  );
}

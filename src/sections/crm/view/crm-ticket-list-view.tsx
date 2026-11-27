'use client';

import type { CrmAgent, CrmDepartment } from 'src/types/services/crm';
import type {
  CrmTicket,
  CrmTicketList,
  CrmTicketConfig,
  CrmTicketStatus,
  CrmTicketSlaEvent,
  CrmTicketPriority,
  CrmTicketUpdatedEvent,
} from 'src/types/services/crm-ticket';

import { useRef, useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { hasCrmRole } from 'src/hooks/use-crm-permission';

import { fDateTime } from 'src/utils/format-time';

import { CrmService } from 'src/services/crm';
import { useCrmSocketEvent } from 'src/lib/socket';
import { DashboardContent } from 'src/layouts/dashboard';
import { CrmTicketService } from 'src/services/crm-ticket';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { TableNoData, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import {
  CRM_TICKET_STATUSES,
  CRM_TICKET_PRIORITIES,
  CRM_TICKET_STATUS_COLORS,
  CRM_TICKET_PRIORITY_COLORS,
} from 'src/types/services/crm-ticket';

import { CrmAccessGuard } from '../crm-access-guard';
import { useCrmAccess } from '../crm-access-context';
import { CrmTicketCreatedBy } from '../tickets/crm-ticket-created-by';
import { CrmTicketFormDialog } from '../tickets/crm-ticket-form-dialog';
import { CrmTicketDetailsDrawer } from '../tickets/crm-ticket-details-drawer';
import { slaColor, statusLabel, isTicketDone, fSlaRemaining, priorityLabel } from '../tickets/utils';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'protocol', label: 'Protocolo', width: 150 },
  { id: 'subject', label: 'Assunto' },
  { id: 'category', label: 'Categoria', width: 140 },
  { id: 'priority', label: 'Prioridade', width: 110 },
  { id: 'status', label: 'Status', width: 150 },
  { id: 'department', label: 'Setor', width: 140 },
  { id: 'assignee', label: 'Responsável', width: 150 },
  { id: 'sla', label: 'Prazo do SLA', width: 170 },
  { id: 'createdBy', label: 'Criado por', width: 150 },
];

type TabValue = CrmTicketStatus | 'all';

type Filters = {
  search: string;
  priority: CrmTicketPriority | '';
  category: string;
  departmentId: string;
  assignee: string;
  sla: 'warning' | 'breached' | '';
};

const EMPTY_FILTERS: Filters = { search: '', priority: '', category: '', departmentId: '', assignee: '', sla: '' };

const EMPTY_COUNTS: Record<CrmTicketStatus, number> = {
  aberto: 0,
  em_andamento: 0,
  aguardando_cliente: 0,
  resolvido: 0,
  fechado: 0,
};

/** Relógio para o tempo restante do SLA (atualiza a cada 30 s). */
function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function CrmTicketListView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Chamados"
        links={[{ name: 'CRM', href: paths.dashboard.crm.root }, { name: 'Chamados' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <CrmAccessGuard min="agente">
        <TicketList />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

function TicketList() {
  const { me } = useCrmAccess();
  const canSupervise = hasCrmRole(me?.role, 'supervisor');
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');
  const now = useNow();
  const createDialog = useBoolean();

  // Dados de apoio
  const [config, setConfig] = useState<CrmTicketConfig | null>(null);
  const [departments, setDepartments] = useState<CrmDepartment[]>([]);
  const [agents, setAgents] = useState<CrmAgent[]>([]);

  useEffect(() => {
    CrmTicketService.getConfig()
      .then(setConfig)
      .catch((err) => toast.error(err?.message || 'Erro ao carregar as categorias de chamados'));
    CrmService.listDepartments().then(setDepartments).catch(() => undefined);
    CrmService.listAgents().then(setAgents).catch(() => undefined);
  }, []);

  // Lista
  const [tab, setTab] = useState<TabValue>('aberto');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(30);
  const [data, setData] = useState<CrmTicketList | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [highlighted, setHighlighted] = useState<Record<string, 'warning' | 'breached'>>({});
  const [live, setLive] = useState<CrmTicket | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(filters.search.trim()), 350);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    CrmTicketService.list({
      status: tab === 'all' ? undefined : tab,
      priority: filters.priority || undefined,
      category: filters.category || undefined,
      departmentId: filters.departmentId || undefined,
      assignee: filters.assignee || undefined,
      sla: filters.sla || undefined,
      search: search || undefined,
      page: page + 1,
      perPage,
    })
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && toast.error(err?.message || 'Erro ao carregar os chamados'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [
    tab,
    filters.priority,
    filters.category,
    filters.departmentId,
    filters.assignee,
    filters.sla,
    search,
    page,
    perPage,
    refreshKey,
  ]);

  // Recarrega em segundo plano (contadores e filtros) depois de rajadas de eventos.
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => setRefreshKey((k) => k + 1), 2000);
  }, []);
  useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    },
    []
  );

  const replaceRow = useCallback((ticket: CrmTicket) => {
    setData((current) =>
      current
        ? { ...current, items: current.items.map((t) => (t.id === ticket.id ? { ...t, ...ticket } : t)) }
        : current
    );
  }, []);

  useCrmSocketEvent<CrmTicketUpdatedEvent>('crm:ticket:updated', ({ ticket }) => {
    if (!ticket?.id) return;
    replaceRow(ticket);
    setLive(ticket);
    scheduleRefresh();
  });

  useCrmSocketEvent<CrmTicketSlaEvent>('crm:ticket:sla', ({ ticketId, protocol, level }) => {
    if (level === 'breached') {
      toast.error(`SLA estourado: chamado ${protocol}`);
    } else {
      toast.warning(`SLA perto de estourar: chamado ${protocol}`);
    }
    setHighlighted((h) => ({ ...h, [ticketId]: level }));
    setData((current) =>
      current
        ? {
            ...current,
            items: current.items.map((t) => (t.id === ticketId ? { ...t, slaState: level } : t)),
          }
        : current
    );
  });

  const set = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(0);
  };

  const select = useCallback((id: string | null) => router.push(id ? `?id=${id}` : '?'), [router]);

  const counts = data?.counts ?? EMPTY_COUNTS;
  const totalCount = CRM_TICKET_STATUSES.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
  const rows = data?.items ?? [];
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);
  const priorities = config?.priorities.length ? config.priorities.map((p) => p.key) : CRM_TICKET_PRIORITIES;
  const statuses = config?.statuses.length ? config.statuses.map((s) => s.key) : CRM_TICKET_STATUSES;

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2, mt: { xs: -2, md: -4 } }}>
        <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={createDialog.onTrue}>
          Novo chamado
        </Button>
      </Stack>

      <Card>
        <Tabs
          value={tab}
          onChange={(_e, v: TabValue) => {
            setTab(v);
            setPage(0);
          }}
          variant="scrollable"
          sx={{ px: 2.5, boxShadow: (theme) => `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}` }}
        >
          {statuses.map((s) => (
            <Tab
              key={s}
              value={s}
              iconPosition="end"
              label={statusLabel(config, s)}
              icon={
                <Label variant={tab === s ? 'filled' : 'soft'} color={CRM_TICKET_STATUS_COLORS[s] ?? 'default'}>
                  {counts[s] ?? 0}
                </Label>
              }
            />
          ))}
          <Tab
            value="all"
            iconPosition="end"
            label="Todos"
            icon={
              <Label variant={tab === 'all' ? 'filled' : 'soft'} color="default">
                {totalCount}
              </Label>
            }
          />
        </Tabs>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2.5 }}
          alignItems={{ md: 'center' }}
          flexWrap="wrap"
          useFlexGap
        >
          <TextField
            size="small"
            placeholder="Buscar por protocolo, assunto ou contato..."
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            sx={{ flex: 1, minWidth: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            label="Prioridade"
            value={filters.priority}
            onChange={(e) => set({ priority: e.target.value as Filters['priority'] })}
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="">Todas</MenuItem>
            {priorities.map((p) => (
              <MenuItem key={p} value={p}>
                {priorityLabel(config, p)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Categoria"
            value={filters.category}
            onChange={(e) => set({ category: e.target.value })}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Todas</MenuItem>
            {(config?.categories ?? []).map((c) => (
              <MenuItem key={c.key} value={c.key}>
                {c.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Setor"
            value={filters.departmentId}
            onChange={(e) => set({ departmentId: e.target.value })}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Responsável"
            value={filters.assignee}
            onChange={(e) => set({ assignee: e.target.value })}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="me">Comigo</MenuItem>
            <MenuItem value="unassigned">Sem responsável</MenuItem>
            {canSupervise &&
              agents.map((a) => (
                <MenuItem key={`${a.userType}:${a.userId}`} value={a.userId}>
                  {a.name || a.userId}
                </MenuItem>
              ))}
          </TextField>
          <TextField
            select
            size="small"
            label="SLA"
            value={filters.sla}
            onChange={(e) => set({ sla: e.target.value as Filters['sla'] })}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="warning">Perto de estourar</MenuItem>
            <MenuItem value="breached">Estourado</MenuItem>
          </TextField>
          {hasFilters && (
            <Button
              color="error"
              onClick={() => set(EMPTY_FILTERS)}
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            >
              Limpar
            </Button>
          )}
        </Stack>

        <Divider />
        <Box sx={{ height: 2 }}>{loading && <LinearProgress sx={{ height: 2 }} />}</Box>

        <Scrollbar>
          <TableContainer sx={{ minWidth: 1200 }}>
            <Table size="small">
              <TableHeadCustom headLabel={TABLE_HEAD} />
              <TableBody>
                {rows.map((row) => (
                  <TicketRow
                    key={row.id}
                    row={row}
                    now={now}
                    config={config}
                    highlight={highlighted[row.id] ?? null}
                    selected={selectedId === row.id}
                    onClick={() => select(row.id)}
                  />
                ))}
                <TableNoData
                  notFound={!loading && rows.length === 0}
                  title="Nenhum chamado"
                  description={hasFilters ? 'Nada encontrado com esses filtros.' : 'Nenhum chamado nesta situação.'}
                />
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePaginationCustom
          count={data?.total ?? 0}
          page={page}
          rowsPerPage={perPage}
          onPageChange={(_e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[30, 50, 100]}
        />
      </Card>

      <CrmTicketDetailsDrawer
        ticketId={selectedId}
        onClose={() => select(null)}
        config={config}
        departments={departments}
        agents={agents}
        live={live}
        now={now}
        onUpdated={(ticket) => {
          replaceRow(ticket);
          scheduleRefresh();
        }}
      />

      <CrmTicketFormDialog
        open={createDialog.value}
        onClose={createDialog.onFalse}
        config={config}
        departments={departments}
        onCreated={(ticket) => {
          setRefreshKey((k) => k + 1);
          select(ticket.id);
        }}
      />
    </>
  );
}

// ----------------------------------------------------------------------

type RowProps = {
  row: CrmTicket;
  now: number;
  config: CrmTicketConfig | null;
  highlight: 'warning' | 'breached' | null;
  selected: boolean;
  onClick: () => void;
};

function TicketRow({ row, now, config, highlight, selected, onClick }: RowProps) {
  const done = row.slaState === 'done' || isTicketDone(row.status);
  let level: 'warning' | 'breached' | null = null;
  if (!done && (row.slaState === 'breached' || highlight === 'breached')) level = 'breached';
  else if (!done && (row.slaState === 'warning' || highlight === 'warning')) level = 'warning';
  const slaState = done ? 'done' : (level ?? 'ok');

  return (
    <TableRow
      hover
      selected={selected}
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        ...(highlight &&
          !done && {
            bgcolor: (theme) =>
              alpha(highlight === 'breached' ? theme.palette.error.main : theme.palette.warning.main, 0.08),
          }),
      }}
    >
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Typography variant="subtitle2">{row.protocol}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {fDateTime(row.createdAt, 'DD/MM/YYYY HH:mm')}
        </Typography>
      </TableCell>
      <TableCell sx={{ maxWidth: 320 }}>
        <Typography variant="body2" noWrap title={row.subject}>
          {row.subject}
        </Typography>
        {(row.contact?.name || row.student?.name) && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap component="div">
            {[row.contact?.name, row.student?.name ? `aluno: ${row.student.name}` : null].filter(Boolean).join(' · ')}
          </Typography>
        )}
      </TableCell>
      <TableCell>{row.categoryLabel || row.category}</TableCell>
      <TableCell>
        <Label variant="soft" color={CRM_TICKET_PRIORITY_COLORS[row.priority] ?? 'default'}>
          {priorityLabel(config, row.priority)}
        </Label>
      </TableCell>
      <TableCell>
        <Label variant="soft" color={CRM_TICKET_STATUS_COLORS[row.status] ?? 'default'}>
          {statusLabel(config, row.status)}
        </Label>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap sx={{ color: row.departmentName ? 'text.primary' : 'text.disabled' }}>
          {row.departmentName || 'Sem setor'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap sx={{ color: row.assignee ? 'text.primary' : 'text.disabled' }}>
          {row.assignee ? row.assignee.name || row.assignee.id : 'Sem responsável'}
        </Typography>
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Tooltip title={`Prazo: ${fDateTime(row.slaDueAt, 'DD/MM/YYYY HH:mm')} (${row.slaHours}h úteis)`}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            {level && (
              <Iconify
                icon={level === 'breached' ? 'solar:danger-triangle-bold' : 'solar:alarm-bold'}
                width={18}
                sx={{ color: slaColor(level) }}
              />
            )}
            <Stack>
              <Typography variant="body2" sx={{ color: slaColor(slaState), fontWeight: level ? 600 : 400 }}>
                {done ? 'Concluído' : fSlaRemaining(row.slaDueAt, now)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {fDateTime(row.slaDueAt, 'DD/MM HH:mm')}
              </Typography>
            </Stack>
          </Stack>
        </Tooltip>
      </TableCell>
      <TableCell>
        <CrmTicketCreatedBy createdBy={row.createdBy} />
      </TableCell>
    </TableRow>
  );
}

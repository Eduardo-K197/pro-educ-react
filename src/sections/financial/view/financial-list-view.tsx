'use client';

import type { EntryListItem } from 'src/types/services/entry';
import { getTraducedStatus } from 'src/types/services/entry';

import { useState, useCallback, useEffect, useMemo } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useBoolean } from 'src/hooks/use-boolean';
import { useRolePermissions } from 'src/hooks/use-role-permissions';

import { varAlpha } from 'src/theme/styles';
import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import { EntryService } from 'src/services/entry';

import { DashboardContent } from 'src/layouts/dashboard';
import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, getComparator } from 'src/components/table';
import { CustomTable } from 'src/components/list-table/list-table';

import { FinancialTableRow } from '../financial-table-row';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'Pendente', label: 'Pendente' },
  { value: 'Pago', label: 'Recebido' },
  { value: 'Atrasado', label: 'Em atraso' },
];

const TABLE_HEAD = [
  { id: 'description', label: 'Descrição / Aluno' },
  { id: 'value', label: 'Valor', width: 110 },
  { id: 'originalValue', label: 'V. Original', width: 110 },
  { id: 'dueDate', label: 'Vencimento', width: 115 },
  { id: 'paymentDate', label: 'Dt. Pagamento', width: 120 },
  { id: 'installmentNumber', label: 'Parcela', width: 80 },
  { id: 'status', label: 'Status', width: 160 },
  { id: 'billingType', label: 'Tipo', width: 90 },
  { id: '', width: 120 },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

// ----------------------------------------------------------------------

export function FinancialListView() {
  const table = useTable({ defaultOrderBy: 'dueDate', defaultRowsPerPage: 10 });
  const confirm = useBoolean();
  const { canCreateFinancial, canDeleteFinancial } = useRolePermissions();

  const [tableData, setTableData] = useState<EntryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmPaymentRow, setConfirmPaymentRow] = useState<EntryListItem | null>(null);

  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string>(String(CURRENT_YEAR));
  const [dueDateStart, setDueDateStart] = useState('');
  const [dueDateEnd, setDueDateEnd] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [entriesRes, paymentsRes] = await Promise.all([
        EntryService.listEntries({ hasPagination: false }).catch(() => ({ entries: [] })),
        EntryService.listPayments().catch(() => ({ entries: [] })),
      ]);
      const entries = (entriesRes as any).entries ?? [];
      const payments = (paymentsRes as any).entries ?? [];
      setTableData([...entries, ...payments]);
    } catch {
      toast.error('Erro ao carregar lançamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const dataFiltered = useMemo(() => {
    const stabilized = tableData.map((el, i) => [el, i] as const);
    const cmp = getComparator(table.order, table.orderBy);
    stabilized.sort((a, b) => {
      const order = cmp(a[0] as any, b[0] as any);
      return order !== 0 ? order : a[1] - b[1];
    });
    let data = stabilized.map((el) => el[0]);

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (e) =>
          (e.description ?? '').toLowerCase().includes(q) ||
          (e.student?.name ?? '').toLowerCase().includes(q)
      );
    }

    if (status !== 'all') {
      data = data.filter((e) => getTraducedStatus(e) === status);
    }

    if (yearFilter) {
      data = data.filter((e) => {
        const d = e.dueDate ?? e.dateCreated;
        return d ? new Date(d).getFullYear() === Number(yearFilter) : true;
      });
    }

    if (dueDateStart) {
      data = data.filter((e) => e.dueDate && e.dueDate >= dueDateStart);
    }
    if (dueDateEnd) {
      data = data.filter((e) => e.dueDate && e.dueDate <= dueDateEnd);
    }

    return data;
  }, [tableData, search, status, yearFilter, dueDateStart, dueDateEnd, table.order, table.orderBy]);

  // Summary from filtered data
  const totalPending = dataFiltered.filter((e) => getTraducedStatus(e) === 'Pendente').reduce((s, e) => s + (e.value ?? 0), 0);
  const totalOverdue = dataFiltered.filter((e) => getTraducedStatus(e) === 'Atrasado').reduce((s, e) => s + (e.value ?? 0), 0);
  const totalReceived = dataFiltered.filter((e) => getTraducedStatus(e) === 'Pago').reduce((s, e) => s + (e.value ?? 0), 0);

  const dataInPage = dataFiltered.slice(table.page * table.rowsPerPage, (table.page + 1) * table.rowsPerPage);

  const handleDeleteRow = useCallback(
    async (id: string) => {
      const row = tableData.find((r) => r.id === id);
      try {
        if (row?.source === 'asaas' || row?.bankSlipUrl) {
          await EntryService.deletePayment(id);
        } else {
          await EntryService.deleteEntry(id);
        }
        setTableData((prev) => prev.filter((r) => r.id !== id));
        toast.success('Lançamento excluído');
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch {
        toast.error('Erro ao excluir lançamento');
      }
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(
        table.selected.map((id) => {
          const row = tableData.find((r) => r.id === id);
          return row?.source === 'asaas' || row?.bankSlipUrl
            ? EntryService.deletePayment(id)
            : EntryService.deleteEntry(id);
        })
      );
      setTableData((prev) => prev.filter((r) => !table.selected.includes(r.id)));
      toast.success('Lançamentos excluídos');
      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });
    } catch {
      toast.error('Erro ao excluir');
    }
  }, [dataFiltered.length, dataInPage.length, table, tableData]);

  const handleConfirmPayment = useCallback(async (value: number) => {
    if (!confirmPaymentRow) return;
    try {
      const isGateway = confirmPaymentRow.source === 'asaas' || !!confirmPaymentRow.bankSlipUrl;
      if (isGateway) {
        await EntryService.updatePayment(confirmPaymentRow.id, { value, paidAt: new Date().toISOString(), status: 'received' });
      } else {
        await EntryService.updateEntry(confirmPaymentRow.id, { value, paidAt: new Date().toISOString(), status: 'received' });
      }
      toast.success('Pagamento confirmado!');
      setConfirmPaymentRow(null);
      loadData();
    } catch {
      toast.error('Erro ao confirmar pagamento');
    }
  }, [confirmPaymentRow, loadData]);

  const handleExport = useCallback(() => {
    const rows = dataFiltered.map((e) => ({
      Descrição: e.description ?? '',
      Aluno: e.student?.name ?? '',
      Valor: e.value ?? 0,
      Vencimento: e.dueDate ? fDate(e.dueDate) : '',
      'Dt. Pagamento': e.paymentDate ? fDate(e.paymentDate) : '',
      Status: getTraducedStatus(e),
      Tipo: e.billingType ?? '',
      Parcela: e.installmentNumber ?? '',
    }));

    const headers = Object.keys(rows[0] ?? {});
    const csvContent = [
      headers.join(';'),
      ...rows.map((r) => headers.map((h) => `"${(r as any)[h]}"`).join(';')),
    ].join('\n');

    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro-${yearFilter || 'todos'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dataFiltered, yearFilter]);

  const hasActiveFilters = dueDateStart || dueDateEnd || (yearFilter !== String(CURRENT_YEAR));

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Financeiro"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Financeiro', href: paths.dashboard.financial.root },
          { name: 'Lançamentos' },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="soft"
              color="inherit"
              startIcon={<Iconify icon="solar:export-bold" />}
              onClick={handleExport}
              disabled={dataFiltered.length === 0}
            >
              Exportar CSV
            </Button>
            {canCreateFinancial && (
              <Button
                component={RouterLink}
                href={paths.dashboard.financial.new}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                Novo lançamento
              </Button>
            )}
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Resumo financeiro (reflete filtros ativos) */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Pendente', value: totalPending, color: 'warning.main', icon: 'solar:clock-circle-bold-duotone' },
          { label: 'Em atraso', value: totalOverdue, color: 'error.main', icon: 'solar:danger-triangle-bold-duotone' },
          { label: 'Recebido', value: totalReceived, color: 'success.main', icon: 'solar:check-circle-bold-duotone' },
        ].map((item) => (
          <Stack
            key={item.label}
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ flex: 1, p: 2, borderRadius: 1.5, bgcolor: 'background.neutral' }}
          >
            <Iconify icon={item.icon} width={28} sx={{ color: item.color }} />
            <Stack>
              <Label variant="soft" color={item.color === 'success.main' ? 'success' : item.color === 'error.main' ? 'error' : 'warning'}>
                {item.label}
              </Label>
              <span style={{ fontWeight: 700, fontSize: 18 }}>{fCurrency(item.value)}</span>
            </Stack>
          </Stack>
        ))}
      </Stack>

      <CustomTable
        table={table}
        dataFiltered={dataFiltered}
        tableHead={TABLE_HEAD}
        notFound={!loading && dataFiltered.length === 0}
        loading={loading}
        totalCount={dataFiltered.length}
        onDeleteRows={canDeleteFinancial ? handleDeleteRows : undefined}
        filters={
          <>
            {/* Tabs de status */}
            <Tabs
              value={status}
              onChange={(_, v) => { table.onResetPage(); setStatus(v); }}
              sx={{
                px: 2.5,
                boxShadow: (theme) =>
                  `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              }}
            >
              {STATUS_OPTIONS.map((tab) => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  label={tab.label}
                  iconPosition="end"
                  icon={
                    <Label
                      variant={tab.value === status ? 'filled' : 'soft'}
                      color={tab.value === 'Pago' ? 'success' : tab.value === 'Atrasado' ? 'error' : tab.value === 'Pendente' ? 'warning' : 'default'}
                    >
                      {tab.value === 'all'
                        ? tableData.length
                        : tableData.filter((e) => getTraducedStatus(e) === tab.value).length}
                    </Label>
                  }
                />
              ))}
            </Tabs>

            {/* Filtros */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ sm: 'center' }}
              sx={{ p: 2.5 }}
            >
              <TextField
                size="small"
                value={search}
                onChange={(e) => { table.onResetPage(); setSearch(e.target.value); }}
                placeholder="Buscar descrição ou aluno..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 240, flexGrow: 1, maxWidth: { sm: 340 } }}
              />

              <TextField
                select
                size="small"
                label="Ano"
                value={yearFilter}
                onChange={(e) => { table.onResetPage(); setYearFilter(e.target.value); }}
                sx={{ minWidth: 110 }}
              >
                <MenuItem value="">Todos</MenuItem>
                {YEAR_OPTIONS.map((y) => (
                  <MenuItem key={y} value={String(y)}>{y}</MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                label="Vencimento de"
                type="date"
                value={dueDateStart}
                onChange={(e) => { table.onResetPage(); setDueDateStart(e.target.value); }}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 160 }}
              />

              <TextField
                size="small"
                label="Vencimento até"
                type="date"
                value={dueDateEnd}
                onChange={(e) => { table.onResetPage(); setDueDateEnd(e.target.value); }}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 160 }}
              />

              {hasActiveFilters && (
                <Button
                  size="small"
                  color="error"
                  variant="soft"
                  startIcon={<Iconify icon="solar:restart-bold" width={16} />}
                  onClick={() => {
                    setYearFilter(String(CURRENT_YEAR));
                    setDueDateStart('');
                    setDueDateEnd('');
                  }}
                >
                  Limpar
                </Button>
              )}
            </Stack>

            {hasActiveFilters && (
              <>
                <Divider />
                <Stack direction="row" spacing={1} sx={{ px: 2.5, pb: 1.5 }}>
                  {yearFilter && yearFilter !== String(CURRENT_YEAR) && (
                    <Label variant="soft" color="primary">Ano: {yearFilter}</Label>
                  )}
                  {dueDateStart && (
                    <Label variant="soft" color="default">De: {fDate(dueDateStart)}</Label>
                  )}
                  {dueDateEnd && (
                    <Label variant="soft" color="default">Até: {fDate(dueDateEnd)}</Label>
                  )}
                </Stack>
              </>
            )}
          </>
        }
      >
        {dataInPage.map((row) => (
          <FinancialTableRow
            key={row.id}
            row={row}
            selected={table.selected.includes(row.id)}
            onSelectRow={() => table.onSelectRow(row.id)}
            onDeleteRow={() => handleDeleteRow(row.id)}
            onConfirmPayment={setConfirmPaymentRow}
            canDelete={canDeleteFinancial}
          />
        ))}
      </CustomTable>

      <ConfirmPaymentDialog
        open={!!confirmPaymentRow}
        defaultValue={confirmPaymentRow?.value ?? 0}
        description={confirmPaymentRow?.description ?? undefined}
        onClose={() => setConfirmPaymentRow(null)}
        onConfirm={handleConfirmPayment}
      />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function ConfirmPaymentDialog({
  open, defaultValue, description, onClose, onConfirm,
}: {
  open: boolean;
  defaultValue: number;
  description?: string;
  onClose: () => void;
  onConfirm: (value: number) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => { setValue(defaultValue); }, [defaultValue]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Confirmar recebimento</DialogTitle>
      <DialogContent>
        {description && (
          <Label sx={{ mb: 2 }} variant="soft" color="default">{description}</Label>
        )}
        <TextField
          fullWidth
          label="Valor recebido (R$)"
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" color="success" onClick={() => onConfirm(value)}>Confirmar</Button>
      </DialogActions>
    </Dialog>
  );
}

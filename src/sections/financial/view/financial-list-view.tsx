'use client';

import type { EntryListItem, IEntryTableFilters } from 'src/types/services/entry';
import { getTraducedStatus } from 'src/types/services/entry';

import { useState, useCallback, useEffect } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';
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
import { useSetState } from 'src/hooks/use-set-state';
import { useRolePermissions } from 'src/hooks/use-role-permissions';

import { varAlpha } from 'src/theme/styles';
import { fCurrency } from 'src/utils/format-number';

import { EntryService } from 'src/services/entry';

import { DashboardContent } from 'src/layouts/dashboard';
import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, getComparator, rowInPage } from 'src/components/table';
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

// ----------------------------------------------------------------------

export function FinancialListView() {
  const table = useTable({ defaultOrderBy: 'dueDate' });
  const confirm = useBoolean();
  const { canCreateFinancial, canDeleteFinancial } = useRolePermissions();

  const [tableData, setTableData] = useState<EntryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmPaymentRow, setConfirmPaymentRow] = useState<EntryListItem | null>(null);

  const filters = useSetState<IEntryTableFilters>({
    description: '',
    status: 'all',
    startDate: null,
    endDate: null,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [entriesRes, paymentsRes] = await Promise.all([
        EntryService.listEntries({ hasPagination: false }).catch(() => ({ entries: [] })),
        EntryService.listPayments().catch(() => ({ entries: [] })),
      ]);
      // Both endpoints return { entries: [] }
      const entries = (entriesRes as any).entries ?? [];
      const payments = (paymentsRes as any).entries ?? [];
      setTableData([...entries, ...payments]);
    } catch {
      toast.error('Erro ao carregar lançamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const totalPending = tableData
    .filter((e) => getTraducedStatus(e) === 'Pendente')
    .reduce((acc, e) => acc + (e.value ?? 0), 0);
  const totalOverdue = tableData
    .filter((e) => getTraducedStatus(e) === 'Atrasado')
    .reduce((acc, e) => acc + (e.value ?? 0), 0);
  const totalReceived = tableData
    .filter((e) => getTraducedStatus(e) === 'Pago')
    .reduce((acc, e) => acc + (e.value ?? 0), 0);

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
        await EntryService.updatePayment(confirmPaymentRow.id, {
          value,
          paidAt: new Date().toISOString(),
          status: 'received',
        });
      } else {
        await EntryService.updateEntry(confirmPaymentRow.id, {
          value,
          paidAt: new Date().toISOString(),
          status: 'received',
        });
      }
      toast.success('Pagamento confirmado!');
      setConfirmPaymentRow(null);
      loadData();
    } catch {
      toast.error('Erro ao confirmar pagamento');
    }
  }, [confirmPaymentRow, loadData]);

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
          canCreateFinancial && (
            <Button
              component={RouterLink}
              href={paths.dashboard.financial.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Novo lançamento
            </Button>
          )
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Resumo financeiro */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
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
            sx={{
              flex: 1,
              p: 2,
              borderRadius: 1.5,
              bgcolor: 'background.neutral',
            }}
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
        notFound={!dataFiltered.length}
        onDeleteRows={canDeleteFinancial ? handleDeleteRows : undefined}
        filters={
          <>
            <Tabs
              value={filters.state.status}
              onChange={(_, v) => { table.onResetPage(); filters.setState({ status: v }); }}
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
                      variant={tab.value === 'all' || tab.value === filters.state.status ? 'filled' : 'soft'}
                      color={
                        (tab.value === 'received' && 'success') ||
                        (tab.value === 'pending' && 'warning') ||
                        (tab.value === 'overdue' && 'error') ||
                        'default'
                      }
                    >
                      {tab.value === 'all'
                        ? tableData.length
                        : tableData.filter((e) => getTraducedStatus(e) === tab.value).length}
                    </Label>
                  }
                />
              ))}
            </Tabs>

            <Stack sx={{ p: 2.5 }}>
              <TextField
                size="small"
                value={filters.state.description}
                onChange={(e) => { table.onResetPage(); filters.setState({ description: e.target.value }); }}
                placeholder="Buscar lançamento ou aluno..."
                InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                sx={{ maxWidth: 400 }}
              />
            </Stack>
          </>
        }
      >
        {dataFiltered
          .slice(table.page * table.rowsPerPage, table.page * table.rowsPerPage + table.rowsPerPage)
          .map((row) => (
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

      {/* Dialog confirmar pagamento */}
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
  open,
  defaultValue,
  description,
  onClose,
  onConfirm,
}: {
  open: boolean;
  defaultValue: number;
  description?: string;
  onClose: () => void;
  onConfirm: (value: number) => void;
}) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Confirmar recebimento</DialogTitle>
      <DialogContent>
        {description && (
          <Label sx={{ mb: 2 }} variant="soft" color="default">
            {description}
          </Label>
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
        <Button variant="contained" color="success" onClick={() => onConfirm(value)}>
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: EntryListItem[];
  filters: IEntryTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { description, status } = filters;

  const stabilized = inputData.map((el, i) => [el, i] as const);
  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    return order !== 0 ? order : a[1] - b[1];
  });
  let data = stabilized.map((el) => el[0]);

  if (description) {
    data = data.filter(
      (e) =>
        (e.description ?? '').toLowerCase().includes(description.toLowerCase()) ||
        (e.student?.name ?? '').toLowerCase().includes(description.toLowerCase())
    );
  }

  if (status !== 'all') {
    data = data.filter((e) => getTraducedStatus(e) === status);
  }

  return data;
}

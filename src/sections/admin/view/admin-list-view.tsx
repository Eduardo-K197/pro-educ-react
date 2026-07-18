'use client';

import type { AdminListItem, IAdminTableFilters, IAdminItem } from 'src/types/services/admin';
import { useState, useCallback, useEffect, useMemo } from 'react';

import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';
import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { fIsAfter, fIsBetween } from 'src/utils/format-time';
import { varAlpha } from 'src/theme/styles';

import { AdminService } from 'src/services/admin';
import { ApiService } from 'src/services/api/api';

import { DashboardContent } from 'src/layouts/dashboard';
import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useTable, getComparator, rowInPage } from 'src/components/table';
import { CustomTable } from 'src/components/list-table/list-table';

import { AdminTableRow } from '../admin-table-row';
import { AdminTableToolbar } from '../admin-table-toolbar';
import { AdminTableFiltersResult } from '../admin-table-filters-result';

const ROLE_LABELS: Record<string, string> = {
  superAdmin: 'Super Admin',
  admin: 'Admin',
  manager: 'Gerente',
  employee: 'Funcionário',
  teacher: 'Professor',
  master: 'Master',
  user: 'Usuário',
};

const TABLE_HEAD = [
  { id: 'name', label: 'Nome' },
  { id: 'school', label: 'Escolas', width: 300 },
  { id: 'role', label: 'Tipo', width: 120 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function AdminListView() {
  const table = useTable({ defaultOrderBy: 'name', defaultRowsPerPage: 10 });
  const router = useRouter();
  const confirm = useBoolean();

  type TableEntry = AdminListItem & { _entityType?: 'admin' | 'employee' };
  const [tableData, setTableData] = useState<TableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = useSetState<IAdminTableFilters>({
    name: '',
    role: 'all',
    startDate: null,
    endDate: null,
  });

  const dateError = fIsAfter(filters.state.startDate, filters.state.endDate);

  const roleOptions = useMemo(() => {
    const existing = Array.from(new Set(tableData.map((u) => u.role).filter((r): r is string => !!r)));
    return [
      { value: 'all', label: 'Todos' },
      ...existing.map((r) => ({ value: r as string, label: ROLE_LABELS[r as string] ?? r })),
    ];
  }, [tableData]);

  const loadAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const [adminResult, empResult] = await Promise.allSettled([
        AdminService.list(),
        ApiService.get<{ employees: AdminListItem[] }>('/employees'),
      ]);

      const admins: AdminListItem[] =
        adminResult.status === 'fulfilled'
          ? ((adminResult.value as any).admins ?? adminResult.value)
          : [];

      const employees: AdminListItem[] =
        empResult.status === 'fulfilled' ? (empResult.value.employees ?? []) : [];

      setTableData([
        ...admins.map((a) => ({ ...a, _entityType: 'admin' as const })),
        ...employees.map((e) => ({ ...e, _entityType: 'employee' as const })),
      ]);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
    dateError: false,
  });

  const canReset =
    !!filters.state.name ||
    !!filters.state.startDate ||
    !!filters.state.endDate ||
    filters.state.role !== 'all';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const deleteUser = useCallback(
    (id: string) => {
      const row = tableData.find((r) => r.id === id);
      return row?._entityType === 'employee'
        ? ApiService.delete(`/employees/${id}`)
        : AdminService.delete(id);
    },
    [tableData]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await deleteUser(id);
        setTableData((prev) => prev.filter((row) => row.id !== id));
        toast.success('Usuário excluído com sucesso!');
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (error) {
        toast.error('Erro ao excluir usuário');
      }
    },
    [dataInPage.length, deleteUser, table]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const idsToDelete = table.selected;
      await Promise.all(idsToDelete.map((id) => deleteUser(id)));
      setTableData((prev) => prev.filter((row) => !idsToDelete.includes(row.id)));
      toast.success('Usuários excluídos com sucesso!');
      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });
    } catch (error) {
      toast.error('Erro ao excluir usuários');
    }
  }, [dataFiltered.length, dataInPage.length, deleteUser, table]);

  const handleViewRow = useCallback(
    (id: string) => {
      router.push(paths.dashboard.admins.details(id));
    },
    [router]
  );

  const handleEditRow = useCallback(
    (id: string) => {
      router.push(paths.dashboard.admins.edit(id));
    },
    [router]
  );

  const handleFilterRole = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      filters.setState({ role: newValue });
    },
    [filters, table]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Usuários"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Usuários', href: paths.dashboard.admins.root },
          { name: 'Lista' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.admins.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Novo Usuário
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CustomTable
        table={table}
        dataFiltered={dataFiltered}
        tableHead={TABLE_HEAD}
        notFound={notFound}
        loading={loading}
        onDeleteRows={handleDeleteRows}

        filters={
          <>
            <Tabs
              value={filters.state.role}
              onChange={handleFilterRole}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: 2.5,
                boxShadow: (theme) =>
                  `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              }}
            >
              {roleOptions.map((opt) => (
                <Tab
                  key={opt.value}
                  iconPosition="end"
                  value={opt.value}
                  label={opt.label}
                  icon={
                    <Label
                      variant={
                        (opt.value === 'all' || opt.value === filters.state.role) ? 'filled' : 'soft'
                      }
                      color="default"
                    >
                      {opt.value === 'all'
                        ? tableData.length
                        : tableData.filter((u) => u.role === opt.value).length}
                    </Label>
                  }
                />
              ))}
            </Tabs>

            <AdminTableToolbar
              filters={filters}
              onResetPage={table.onResetPage}
              dateError={dateError}
            />

            {canReset && (
              <AdminTableFiltersResult
                filters={filters}
                totalResults={dataFiltered.length}
                onResetPage={table.onResetPage}
                sx={{ p: 2.5, pt: 0 }}
              />
            )}
          </>
        }
      >
        {dataFiltered
          .slice(
            table.page * table.rowsPerPage,
            table.page * table.rowsPerPage + table.rowsPerPage
          )
          .map((row) => (
            <AdminTableRow
              key={row.id}
              row={row}
              selected={table.selected.includes(row.id)}
              onSelectRow={() => table.onSelectRow(row.id)}
              onDeleteRow={() => handleDeleteRow(row.id)}
              onEditRow={() => handleEditRow(row.id)}
              onViewRow={() => handleViewRow(row.id)}
              onRefresh={loadAdmins}
            />
          ))}
      </CustomTable>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Confirmar exclusão"
        content={
          <>
            Tem certeza que deseja excluir <strong>{table.selected.length}</strong> usuário(s)?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Excluir
          </Button>
        }
      />
    </DashboardContent>
  );
}

type ApplyFilterProps = {
  dateError: boolean;
  inputData: AdminListItem[];
  filters: IAdminTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters, dateError }: ApplyFilterProps) {
  const { name, role, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (admin) =>
        admin.name.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        admin.email.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (role !== 'all') {
    inputData = inputData.filter((user) => user.role === role);
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter((admin) => fIsBetween(admin.createdAt, startDate, endDate));
    }
  }

  return inputData;
}

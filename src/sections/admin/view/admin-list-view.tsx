'use client';

import type { AdminListItem, IAdminTableFilters, IAdminItem } from 'src/types/services/admin';
import { useState, useCallback, useEffect } from 'react';

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

import { DashboardContent } from 'src/layouts/dashboard';
import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { USER_STATUS_OPTIONS } from 'src/_mock';

import { useTable, getComparator, rowInPage } from 'src/components/table';
import { CustomTable } from 'src/components/list-table/list-table';

import { AdminTableRow } from '../admin-table-row';
import { AdminTableToolbar } from '../admin-table-toolbar';
import { AdminTableFiltersResult } from '../admin-table-filters-result';

const STATUS_OPTIONS = [{ value: 'all', label: 'Todos' }, ...USER_STATUS_OPTIONS];

const ROLE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'superAdmin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Gerente' },
  { value: 'employee', label: 'Funcionário' },
  { value: 'teacher', label: 'Professor' },
];

const TABLE_HEAD = [
  { id: 'name', label: 'Nome' },
  { id: 'school', label: 'Escolas', width: 300 },
  { id: 'status', label: 'Status', width: 100 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function AdminListView() {
  const table = useTable({ defaultOrderBy: 'name', defaultRowsPerPage: 10 });
  const router = useRouter();
  const confirm = useBoolean();

  const [tableData, setTableData] = useState<AdminListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = useSetState<IAdminTableFilters>({
    name: '',
    status: 'all',
    role: 'all',
    startDate: null,
    endDate: null,
  });

  const dateError = fIsAfter(filters.state.startDate, filters.state.endDate);

  const loadAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await AdminService.list();
      const admins = (resp as any).admins ?? resp;

      const adminsWithStatus = admins.map((admin: IAdminItem) => ({
        ...admin,
        status: admin.status || 'active',
      }));

      setTableData(adminsWithStatus);
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
    filters.state.status !== 'all' ||
    filters.state.role !== 'all';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await AdminService.delete(id);
        const deleteRow = tableData.filter((row) => row.id !== id);
        toast.success('Usuário excluído com sucesso!');
        setTableData(deleteRow);
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (error) {
        toast.error('Erro ao excluir usuário');
      }
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const idsToDelete = table.selected;
      await Promise.all(idsToDelete.map((id) => AdminService.delete(id)));
      const deleteRows = tableData.filter((row) => !idsToDelete.includes(row.id));
      toast.success('Usuários excluídos com sucesso!');
      setTableData(deleteRows);
      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });
    } catch (error) {
      toast.error('Erro ao excluir usuários');
    }
  }, [dataFiltered.length, dataInPage.length, table, tableData]);

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

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      filters.setState({ status: newValue });
    },
    [filters, table]
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
        onDeleteRows={handleDeleteRows}

        filters={
          <>
            {/* Filtro por status */}
            <Tabs
              value={filters.state.status}
              onChange={handleFilterStatus}
              sx={{
                px: 2.5,
                boxShadow: (theme) =>
                  `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              }}
            >
              {STATUS_OPTIONS.map((tab) => (
                <Tab
                  key={tab.value}
                  iconPosition="end"
                  value={tab.value}
                  label={tab.label}
                  icon={
                    <Label
                      variant={
                        ((tab.value === 'all' || tab.value === filters.state.status) && 'filled') ||
                        'soft'
                      }
                      color={
                        (tab.value === 'active' && 'success') ||
                        (tab.value === 'pending' && 'warning') ||
                        (tab.value === 'banned' && 'error') ||
                        'default'
                      }
                    >
                      {['active', 'pending', 'banned', 'rejected'].includes(tab.value)
                        ? tableData.filter((admin) => admin.status === tab.value).length
                        : tableData.length}
                    </Label>
                  }
                />
              ))}
            </Tabs>

            {/* Filtro por tipo/role */}
            <Box
              sx={{
                px: 2.5,
                pt: 1,
                borderBottom: (theme) =>
                  `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              }}
            >
              <Tabs
                value={filters.state.role}
                onChange={handleFilterRole}
                variant="scrollable"
                scrollButtons="auto"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <Tab
                    key={opt.value}
                    iconPosition="end"
                    value={opt.value}
                    label={opt.label}
                    icon={
                      <Label variant={filters.state.role === opt.value ? 'filled' : 'soft'} color="default">
                        {opt.value === 'all'
                          ? tableData.length
                          : tableData.filter((u) => u.role === opt.value).length}
                      </Label>
                    }
                  />
                ))}
              </Tabs>
            </Box>

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
            />
          ))}
      </CustomTable>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Deletar"
        content={
          <>
            Tem certeza que deseja deletar? <strong> {table.selected.length} </strong> items?
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
            Deletar
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
  const { name, status, role, startDate, endDate } = filters;

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

  if (status !== 'all') {
    inputData = inputData.filter((user) => user.status === status);
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

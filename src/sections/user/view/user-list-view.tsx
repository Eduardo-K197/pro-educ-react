'use client';

import { IUserAccount, IUserItem, IUserTableFilters } from 'src/types/user';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import axios from 'src/utils/axios';

import { varAlpha } from 'src/theme/styles';
import { USER_STATUS_OPTIONS } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  getComparator,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { UserTableRow } from '../user-table-row';
import { useAuthContext } from '../../../auth/hooks';
import { UserTableToolbar } from '../user-table-toolbar';
import { UserTableFiltersResult } from '../user-table-filters-result';

// ----------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...USER_STATUS_OPTIONS];

const TABLE_HEAD = [
  { id: 'name', label: 'Name' },
  { id: 'phoneNumber', label: 'Phone number', width: 180 },
  { id: 'company', label: 'Company', width: 220 },
  { id: 'role', label: 'Role', width: 180 },
  { id: 'status', label: 'Status', width: 100 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------
// tipos vindos do backend
type Student = {
  id: string | number;
  schoolId?: string | null;
  name: string;
  phoneNumber?: string | null;
  email?: string | null;
  address?: string | null;
  status?: string | null; // ex.: "Ativo", "Cancelado" etc.
};

type StudentsPayload = {
  students: Student[];
  count: number;
  page?: number;
  perPage?: number;
};

// normaliza status do back para o UI
function mapStatus(s?: string | null): IUserItem['status'] {
  const v = (s || '').toLowerCase();
  if (['cancelado', 'inativo', 'inactive', 'banned', 'desativado'].includes(v)) return 'banned';
  if (['pendente', 'pending'].includes(v)) return 'pending';
  return 'active';
}

// Student -> IUserItem
function toUserItem(st: Student): IUserItem {
  return {
    id: String(st.id),
    name: st.name || '',
    role: 'student',
    email: st.email || '',
    phoneNumber: st.phoneNumber || '',
    company: st.schoolId ? String(st.schoolId) : '-',
    status: mapStatus(st.status),
    isVerified: true,
    avatarUrl: '',
    address: st.address || '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
  };
}

// ----------------------------------------------------------------------

export function UserListView() {
  const table = useTable();
  const router = useRouter();
  const confirm = useBoolean();

  const [loading, setLoading] = useState<boolean>(true);
  const [tableData, setTableData] = useState<IUserItem[]>([]);
  const [serverTotal, setServerTotal] = useState<number>(0);
  const { user } = useAuthContext();

  const filters = useSetState<IUserTableFilters>({ name: '', role: [], status: 'all' });

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const page = table.page + 1; // 1-based na API
      const perPage = table.rowsPerPage;

      const params: any = {
        hasPagination: 'true',
        page,
        perPage,
      };

      if (filters.state.name?.trim()) params.search = filters.state.name.trim();

      // Se o backend aceitar filtrar status por valor BR, ajuste aqui:
      if (filters.state.status && filters.state.status !== 'all') {
        // mapear 'active'|'pending'|'banned'|'rejected' -> BR se necessário
        const map: Record<string, string> = { active: 'Ativo', pending: 'Pendente', banned: 'Cancelado', rejected: 'Recusado' };
        params.status = map[filters.state.status] || filters.state.status;
      }

      const res = await axios.get('/students', { params }); // baseURL já está no instance
      const payload = res.data as { students: any[]; count: number };
      const items = Array.isArray(payload?.students) ? payload.students : [];
      const total = typeof payload?.count === 'number' ? payload.count : items.length;

      setTableData(items.map(toUserItem));
      setServerTotal(total);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Falha ao carregar estudantes');
      setTableData([]);
      setServerTotal(0);
    } finally {
      setLoading(false);
    }
  }, [table.page, table.rowsPerPage, filters.state.name, filters.state.status]);

  useEffect(() => {
    if (user?.activeSchoolId) fetchStudents();
  }, [fetchStudents, user?.activeSchoolId]);

  // roles (hoje sempre 'student', mas deixa dinâmico)
  const roleOptions = useMemo(() => {
    const set = new Set<string>();
    tableData.forEach((u) => set.add(u.role));
    return Array.from(set);
  }, [tableData]);

  // ordenação e filtros são aplicados somente no que veio desta página
  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const canReset =
    !!filters.state.name || filters.state.role.length > 0 || filters.state.status !== 'all';

  const notFound = (!dataFiltered.length && canReset) || (!loading && !dataFiltered.length);

  // ------- handlers -------
  const handleDeleteRow = useCallback(
    async (id: string) => {
      const deleteRow = tableData.filter((row) => row.id !== id);
      setTableData(deleteRow);
      toast.success('Delete success!');
    },
    [tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));
    setTableData(deleteRows);
    toast.success('Delete success!');
  }, [table, tableData]);

  const handleEditRow = useCallback(
    (id: string) => {
      router.push(paths.dashboard.user.edit(id)); // mantém sua rota atual
    },
    [router]
  );

  const handleFilterStatus = useCallback(
    (_: React.SyntheticEvent, newValue: string) => {
      table.onResetPage(); // volta para página 0 ao mudar filtro
      filters.setState({ status: newValue });
    },
    [filters, table]
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="List"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'User', href: paths.dashboard.user.root },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.user.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New user
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
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
                      ? tableData.filter((user: IUserItem) => user.status === tab.value).length
                      : serverTotal}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <UserTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ roles: roleOptions.length ? roleOptions : ['student'] }}
          />

          {canReset && (
            <UserTableFiltersResult
              filters={filters}
              totalResults={dataFiltered.length}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                )
              }
              action={
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={confirm.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {!loading &&
                    dataFiltered.map((row) => (
                      <UserTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onEditRow={() => handleEditRow(row.id)}
                      />
                    ))}

                  <TableNoData notFound={!loading && notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={serverTotal} // usa COUNT do servidor
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong>{table.selected.length}</strong> items?
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
            Delete
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IUserItem[];
  filters: IUserTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { name, status, role } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter((user) => user.name.toLowerCase().includes(name.toLowerCase()));
  }

  if (status !== 'all') {
    inputData = inputData.filter((user) => user.status === status);
  }

  if (role.length) {
    inputData = inputData.filter((user) => role.includes(user.role));
  }

  return inputData;
}

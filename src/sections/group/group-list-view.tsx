'use client';

import type { IGroupItem } from 'src/types/group';
import { useState, useCallback, useEffect } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useSetState } from 'src/hooks/use-set-state';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { GroupService } from 'src/services/group';
import { GroupTableRow } from './group-table-row';
import { GroupTableToolbar } from './group-table-toolbar';
import { GroupTableFiltersResult } from './group-table-filters-result';

const TABLE_HEAD = [
  { id: 'name', label: 'Nome' },
  { id: 'description', label: 'Descrição' },
  { id: 'active', label: 'Status' },
  { id: '', width: 88 },
];

export function GroupListView() {
  const table = useTable();
  const router = useRouter();

  const [tableData, setTableData] = useState<IGroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = useSetState<any>({
    name: '',
    status: 'all',
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    GroupService.getAll()
      .then((data) => {
        if (mounted) setTableData(data);
      })
      .catch(() => {
        toast.error('Erro ao carregar grupos');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);
  const canReset = !!filters.state.name || filters.state.status !== 'all';
  const notFound = !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await GroupService.delete(id);
        const updated = tableData.filter((row) => row.id !== id);
        setTableData(updated);
        table.onUpdatePageDeleteRow(dataInPage.length);
        toast.success('Grupo excluído com sucesso');
      } catch {
        toast.error('Erro ao excluir grupo');
      }
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => GroupService.delete(id)));
      const updated = tableData.filter((row) => !table.selected.includes(row.id));
      setTableData(updated);
      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });
      toast.success('Grupos excluídos com sucesso');
    } catch {
      toast.error('Erro ao excluir grupos');
    }
  }, [dataFiltered.length, dataInPage.length, table, tableData]);

  const handleEditRow = useCallback(
    (id: string) => {
      router.push(paths.dashboard.group.edit(id));
    },
    [router]
  );

  const handleViewRow = useCallback(
    (id: string) => {
      router.push(paths.dashboard.group.details(id));
    },
    [router]
  );

  if (loading) {
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '60vh' }}>
          <CircularProgress />
        </Stack>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Lista de Grupos"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Grupos', href: paths.dashboard.group.root },
          { name: 'Lista' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.group.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Novo grupo
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <GroupTableToolbar
          filters={filters}
          onResetPage={table.onResetPage}
          options={{ status: [{ value: 'all', label: 'Todos' }] }}
        />

        {canReset && (
          <GroupTableFiltersResult
            filters={filters}
            totalResults={dataFiltered.length}
            onResetPage={table.onResetPage}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

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
              {dataInPage.map((row) => (
                <GroupTableRow
                  key={row.id}
                  row={row}
                  selected={table.selected.includes(row.id)}
                  onSelectRow={() => table.onSelectRow(row.id)}
                  onDeleteRow={() => handleDeleteRow(row.id)}
                  onEditRow={() => handleEditRow(row.id)}
                  onViewRow={() => handleViewRow(row.id)}
                />
              ))}

              <TableEmptyRows
                height={table.dense ? 56 : 76}
                emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
              />

              <TableNoData notFound={notFound} />
            </TableBody>
          </Table>
        </Scrollbar>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={dataFiltered.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}

function applyFilter({
  inputData,
  comparator,
  filters,
}: {
  inputData: IGroupItem[];
  comparator: (a: any, b: any) => number;
  filters: any;
}) {
  const { name, status } = filters;

  const stabilized = inputData.map((el, index) => [el, index] as const);
  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let data = stabilized.map((el) => el[0]);

  if (name) {
    data = data.filter((g) => g.name.toLowerCase().includes(name.toLowerCase()));
  }
  if (status !== 'all') {
    data = data.filter((g) => (status === 'active' ? g.active : !g.active));
  }

  return data;
}

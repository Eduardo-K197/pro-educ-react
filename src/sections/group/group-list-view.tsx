'use client';

import type { IGroupItem } from 'src/types/group';
import { useState, useCallback, useEffect } from 'react';

import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks'; 

import { useSetState } from 'src/hooks/use-set-state';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  getComparator,
  TablePaginationCustom,
} from 'src/components/table';

import { GroupService } from 'src/services/group';
import { GroupTableToolbar } from './group-table-toolbar';
import { GroupTableFiltersResult } from './group-table-filters-result';

import { GroupQuickAddGroup } from './group-quick-add-group';

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
  
  const [openCreate, setOpenCreate] = useState(false);

  const filters = useSetState<any>({
    name: '',
    status: 'all',
  });

  const fetchGroups = useCallback(async () => {
    try {
      const data = await GroupService.getAll();
      setTableData(data); 
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const canReset = !!filters.state.name || filters.state.status !== 'all';

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
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setOpenCreate(true)}
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

      <GroupQuickAddGroup
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onRefresh={fetchGroups} 
      />
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
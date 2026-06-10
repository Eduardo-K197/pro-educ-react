'use client';

import type { TeacherListItem, ITeacherTableFilters } from 'src/types/services/teacher';

import { useState, useCallback, useEffect } from 'react';

import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useSetState } from 'src/hooks/use-set-state';
import { useBoolean } from 'src/hooks/use-boolean';

import { TeacherService } from 'src/services/teacher';

import { DashboardContent } from 'src/layouts/dashboard';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, getComparator, rowInPage } from 'src/components/table';
import { CustomTable } from 'src/components/list-table/list-table';

import { TeacherTableRow } from '../teacher-table-row';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Professor' },
  { id: 'courses', label: 'Cursos', width: 220 },
  { id: 'birthDate', label: 'Nascimento', width: 130 },
  { id: 'hourlyProfit', label: 'Valor/hora', width: 120 },
  { id: '', width: 60 },
];

// ----------------------------------------------------------------------

export function TeacherListView() {
  const table = useTable({ defaultOrderBy: 'name' });
  const confirm = useBoolean();

  const [tableData, setTableData] = useState<TeacherListItem[]>([]);
  const filters = useSetState<ITeacherTableFilters>({ name: '' });

  useEffect(() => {
    TeacherService.list({ perPage: 1000 })
      .then((res) => setTableData((res as any).teachers ?? res ?? []))
      .catch(() => toast.error('Erro ao carregar professores'));
  }, []);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    name: filters.state.name,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await TeacherService.delete(id);
        setTableData((prev) => prev.filter((r) => r.id !== id));
        toast.success('Professor excluído');
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch {
        toast.error('Erro ao excluir professor');
      }
    },
    [dataInPage.length, table]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => TeacherService.delete(id)));
      setTableData((prev) => prev.filter((r) => !table.selected.includes(r.id)));
      toast.success('Professores excluídos');
      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });
    } catch {
      toast.error('Erro ao excluir professores');
    }
  }, [dataFiltered.length, dataInPage.length, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Professores"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Professores', href: paths.dashboard.teachers.root },
          { name: 'Listagem' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.teachers.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Novo professor
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CustomTable
        table={table}
        dataFiltered={dataFiltered}
        tableHead={TABLE_HEAD}
        notFound={!dataFiltered.length}
        onDeleteRows={handleDeleteRows}
        filters={
          <Stack sx={{ p: 2.5 }}>
            <TextField
              size="small"
              value={filters.state.name}
              onChange={(e) => { table.onResetPage(); filters.setState({ name: e.target.value }); }}
              placeholder="Buscar professor..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 400 }}
            />
          </Stack>
        }
      >
        {dataFiltered
          .slice(table.page * table.rowsPerPage, table.page * table.rowsPerPage + table.rowsPerPage)
          .map((row) => (
            <TeacherTableRow
              key={row.id}
              row={row}
              selected={table.selected.includes(row.id)}
              onSelectRow={() => table.onSelectRow(row.id)}
              onDeleteRow={() => handleDeleteRow(row.id)}
            />
          ))}
      </CustomTable>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Excluir professores"
        content={<>Tem certeza? <strong>{table.selected.length}</strong> professores serão excluídos.</>}
        action={
          <Button variant="contained" color="error" onClick={() => { handleDeleteRows(); confirm.onFalse(); }}>
            Excluir
          </Button>
        }
      />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function applyFilter({
  inputData,
  comparator,
  name,
}: {
  inputData: TeacherListItem[];
  comparator: (a: any, b: any) => number;
  name: string;
}) {
  const stabilized = inputData.map((el, i) => [el, i] as const);
  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    return order !== 0 ? order : a[1] - b[1];
  });
  let data = stabilized.map((el) => el[0]);
  if (name) data = data.filter((t) => t.name.toLowerCase().includes(name.toLowerCase()));
  return data;
}

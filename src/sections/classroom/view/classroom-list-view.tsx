'use client';

import type { ClassroomListItem, IClassroomTableFilters } from 'src/types/services/classroom';

import { useState, useCallback, useEffect } from 'react';

import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useSetState } from 'src/hooks/use-set-state';

import { ClassroomService } from 'src/services/classroom';
import { DashboardContent } from 'src/layouts/dashboard';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, rowInPage } from 'src/components/table';
import { CustomTable } from 'src/components/list-table/list-table';

import { ClassroomTableRow } from '../classroom-table-row';

const TABLE_HEAD = [
  { id: 'name', label: 'Turma' },
  { id: 'course', label: 'Curso', width: 200 },
  { id: 'studentCount', label: 'Matriculados', width: 120 },
  { id: 'maxStudentCount', label: 'Capacidade', width: 110 },
  { id: 'vagas', label: 'Vagas Livres', width: 110 },
  { id: '', width: 60 },
];

export function ClassroomListView() {
  const table = useTable({ defaultOrderBy: 'name' });
  const [tableData, setTableData] = useState<ClassroomListItem[]>([]);
  const filters = useSetState<IClassroomTableFilters>({ name: '' });

  useEffect(() => {
    ClassroomService.list()
      .then((res) => setTableData((res as any).classrooms ?? res ?? []))
      .catch(() => toast.error('Erro ao carregar turmas'));
  }, []);

  const dataFiltered = (() => {
    let data = [...tableData];
    if (filters.state.name) data = data.filter((c) => c.name.toLowerCase().includes(filters.state.name.toLowerCase()));
    return data;
  })();

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await ClassroomService.delete(id);
        setTableData((prev) => prev.filter((r) => r.id !== id));
        toast.success('Turma excluída');
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch {
        toast.error('Erro ao excluir turma');
      }
    },
    [dataInPage.length, table]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => ClassroomService.delete(id)));
      setTableData((prev) => prev.filter((r) => !table.selected.includes(r.id)));
      toast.success('Turmas excluídas');
      table.onUpdatePageDeleteRows({ totalRowsInPage: dataInPage.length, totalRowsFiltered: dataFiltered.length });
    } catch {
      toast.error('Erro ao excluir');
    }
  }, [dataFiltered.length, dataInPage.length, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Turmas"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Turmas', href: paths.dashboard.classrooms.root },
          { name: 'Listagem' },
        ]}
        action={
          <Button component={RouterLink} href={paths.dashboard.classrooms.new} variant="contained" startIcon={<Iconify icon="mingcute:add-line" />}>
            Nova turma
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
              placeholder="Buscar turma..."
              InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} /></InputAdornment> }}
              sx={{ maxWidth: 400 }}
            />
          </Stack>
        }
      >
        {dataFiltered
          .slice(table.page * table.rowsPerPage, table.page * table.rowsPerPage + table.rowsPerPage)
          .map((row) => (
            <ClassroomTableRow
              key={row.id}
              row={row}
              selected={table.selected.includes(row.id)}
              onSelectRow={() => table.onSelectRow(row.id)}
              onDeleteRow={() => handleDeleteRow(row.id)}
            />
          ))}
      </CustomTable>
    </DashboardContent>
  );
}

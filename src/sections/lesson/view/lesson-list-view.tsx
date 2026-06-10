'use client';

import type { LessonListItem, ILessonTableFilters } from 'src/types/services/lesson';

import { useState, useCallback, useEffect } from 'react';

import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useSetState } from 'src/hooks/use-set-state';

import { LessonService } from 'src/services/lesson';
import { DashboardContent } from 'src/layouts/dashboard';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, rowInPage } from 'src/components/table';
import { CustomTable } from 'src/components/list-table/list-table';

import { LessonTableRow } from '../lesson-table-row';

const TABLE_HEAD = [
  { id: 'name', label: 'Aula / Descrição' },
  { id: 'classroom', label: 'Turma', width: 160 },
  { id: 'teacher', label: 'Professor', width: 160 },
  { id: 'course', label: 'Curso', width: 160 },
  { id: 'date', label: 'Data', width: 110 },
  { id: 'time', label: 'Horário', width: 120 },
  { id: 'status', label: 'Status', width: 100 },
  { id: '', width: 60 },
];

export function LessonListView() {
  const table = useTable({ defaultOrderBy: 'date' });
  const [tableData, setTableData] = useState<LessonListItem[]>([]);
  const filters = useSetState<ILessonTableFilters>({ name: '' });

  useEffect(() => {
    LessonService.list({ perPage: 1000 })
      .then((res) => setTableData((res as any).classes ?? res ?? []))
      .catch(() => toast.error('Erro ao carregar aulas'));
  }, []);

  const dataFiltered = (() => {
    let data = [...tableData];
    if (filters.state.name) {
      data = data.filter((l) => (l.name ?? l.course?.name ?? '').toLowerCase().includes(filters.state.name.toLowerCase()));
    }
    return data;
  })();

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await LessonService.delete(id);
        setTableData((prev) => prev.filter((r) => r.id !== id));
        toast.success('Aula excluída');
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch {
        toast.error('Erro ao excluir aula');
      }
    },
    [dataInPage.length, table]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => LessonService.delete(id)));
      setTableData((prev) => prev.filter((r) => !table.selected.includes(r.id)));
      toast.success('Aulas excluídas');
      table.onUpdatePageDeleteRows({ totalRowsInPage: dataInPage.length, totalRowsFiltered: dataFiltered.length });
    } catch {
      toast.error('Erro ao excluir');
    }
  }, [dataFiltered.length, dataInPage.length, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Aulas"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Aulas', href: paths.dashboard.lessons.root },
          { name: 'Listagem' },
        ]}
        action={
          <Button component={RouterLink} href={paths.dashboard.lessons.new} variant="contained" startIcon={<Iconify icon="mingcute:add-line" />}>
            Nova aula
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
              placeholder="Buscar aula..."
              InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} /></InputAdornment> }}
              sx={{ maxWidth: 400 }}
            />
          </Stack>
        }
      >
        {dataFiltered
          .slice(table.page * table.rowsPerPage, table.page * table.rowsPerPage + table.rowsPerPage)
          .map((row) => (
            <LessonTableRow
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

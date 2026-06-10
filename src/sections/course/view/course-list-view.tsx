'use client';

import type { CourseListItem, ICourseTableFilters } from 'src/types/services/course';

import { useState, useCallback, useEffect } from 'react';

import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useSetState } from 'src/hooks/use-set-state';

import { CourseService } from 'src/services/course';
import { DashboardContent } from 'src/layouts/dashboard';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, rowInPage } from 'src/components/table';
import { CustomTable } from 'src/components/list-table/list-table';

import { CourseTableRow } from '../course-table-row';

const TABLE_HEAD = [
  { id: 'name', label: 'Curso' },
  { id: 'workload', label: 'Carga horária', width: 140 },
  { id: 'teacherCount', label: 'Professores', width: 140 },
  { id: 'studentCount', label: 'Alunos', width: 120 },
  { id: '', width: 60 },
];

export function CourseListView() {
  const table = useTable({ defaultOrderBy: 'name' });
  const [tableData, setTableData] = useState<CourseListItem[]>([]);
  const filters = useSetState<ICourseTableFilters>({ name: '' });

  useEffect(() => {
    CourseService.list({ perPage: 1000 })
      .then((res) => setTableData((res as any).courses ?? res ?? []))
      .catch(() => toast.error('Erro ao carregar cursos'));
  }, []);

  const dataFiltered = (() => {
    let data = [...tableData];
    if (filters.state.name) {
      data = data.filter((c) => c.name.toLowerCase().includes(filters.state.name.toLowerCase()));
    }
    return data;
  })();

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await CourseService.delete(id);
        setTableData((prev) => prev.filter((r) => r.id !== id));
        toast.success('Curso excluído');
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch {
        toast.error('Erro ao excluir curso');
      }
    },
    [dataInPage.length, table]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => CourseService.delete(id)));
      setTableData((prev) => prev.filter((r) => !table.selected.includes(r.id)));
      toast.success('Cursos excluídos');
      table.onUpdatePageDeleteRows({ totalRowsInPage: dataInPage.length, totalRowsFiltered: dataFiltered.length });
    } catch {
      toast.error('Erro ao excluir');
    }
  }, [dataFiltered.length, dataInPage.length, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Cursos"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Cursos', href: paths.dashboard.courses.root },
          { name: 'Listagem' },
        ]}
        action={
          <Button component={RouterLink} href={paths.dashboard.courses.new} variant="contained" startIcon={<Iconify icon="mingcute:add-line" />}>
            Novo curso
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
              placeholder="Buscar curso..."
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
            <CourseTableRow
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

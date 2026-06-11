'use client';

import type { CourseListItem } from 'src/types/services/course';

import { useState, useCallback, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { CourseService } from 'src/services/course';
import { DashboardContent } from 'src/layouts/dashboard';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable } from 'src/components/table';
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
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params: Record<string, any> = { page: table.page + 1, perPage: table.rowsPerPage };
    if (search) params.search = search;

    CourseService.list(params)
      .then((res) => {
        if (cancelled) return;
        setTableData((res as any).courses ?? []);
        setTotal((res as any).count ?? 0);
      })
      .catch(() => { if (!cancelled) toast.error('Erro ao carregar cursos'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [table.page, table.rowsPerPage, search, refreshKey]);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleSearch = useCallback(
    (value: string) => { table.onResetPage(); setSearch(value); },
    [table]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await CourseService.delete(id);
        toast.success('Curso excluído');
        reload();
      } catch {
        toast.error('Erro ao excluir curso');
      }
    },
    [reload]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => CourseService.delete(id)));
      toast.success('Cursos excluídos');
      table.onSelectAllRows(false, []);
      reload();
    } catch {
      toast.error('Erro ao excluir');
    }
  }, [table, reload]);

  const notFound = !loading && tableData.length === 0;

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
        dataFiltered={tableData}
        tableHead={TABLE_HEAD}
        notFound={notFound}
        loading={loading}
        totalCount={total}
        onDeleteRows={handleDeleteRows}
        filters={
          <Stack sx={{ p: 2.5 }}>
            <TextField
              size="small"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
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
        {tableData.map((row) => (
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

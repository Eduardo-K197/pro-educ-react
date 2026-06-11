'use client';

import type { LessonListItem } from 'src/types/services/lesson';

import { useState, useCallback, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { LessonService } from 'src/services/lesson';
import { DashboardContent } from 'src/layouts/dashboard';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable } from 'src/components/table';
import { CustomTable } from 'src/components/list-table/list-table';

import { LessonTableRow } from '../lesson-table-row';

const TABLE_HEAD = [
  { id: 'name', label: 'Aula / Descrição' },
  { id: 'classroom', label: 'Turma', width: 160 },
  { id: 'teacher', label: 'Professor', width: 160 },
  { id: 'date', label: 'Data', width: 110 },
  { id: 'time', label: 'Horário', width: 120 },
  { id: 'status', label: 'Status', width: 100 },
  { id: '', width: 60 },
];

export function LessonListView() {
  const table = useTable({ defaultOrderBy: 'date' });

  const [tableData, setTableData] = useState<LessonListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params: Record<string, any> = {
      page: table.page + 1,
      perPage: table.rowsPerPage,
    };
    if (search) params.search = search;

    LessonService.list(params)
      .then((res) => {
        if (cancelled) return;
        setTableData((res as any).classes ?? []);
        setTotal((res as any).count ?? 0);
      })
      .catch(() => { if (!cancelled) toast.error('Erro ao carregar aulas'); })
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
        await LessonService.delete(id);
        toast.success('Aula excluída');
        reload();
      } catch {
        toast.error('Erro ao excluir aula');
      }
    },
    [reload]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => LessonService.delete(id)));
      toast.success('Aulas excluídas');
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
              placeholder="Buscar aula..."
              InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} /></InputAdornment> }}
              sx={{ maxWidth: 400 }}
            />
          </Stack>
        }
      >
        {tableData.map((row) => (
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

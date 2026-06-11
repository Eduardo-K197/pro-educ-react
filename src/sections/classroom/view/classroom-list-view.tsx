'use client';

import type { ClassroomListItem } from 'src/types/services/classroom';

import { useState, useCallback, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { ClassroomService } from 'src/services/classroom';
import { DashboardContent } from 'src/layouts/dashboard';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable } from 'src/components/table';
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

    ClassroomService.list(params)
      .then((res) => {
        if (cancelled) return;
        setTableData((res as any).classrooms ?? []);
        setTotal((res as any).count ?? 0);
      })
      .catch(() => { if (!cancelled) toast.error('Erro ao carregar turmas'); })
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
        await ClassroomService.delete(id);
        toast.success('Turma excluída');
        reload();
      } catch {
        toast.error('Erro ao excluir turma');
      }
    },
    [reload]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => ClassroomService.delete(id)));
      toast.success('Turmas excluídas');
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
              placeholder="Buscar turma..."
              InputProps={{ startAdornment: <InputAdornment position="start"><Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} /></InputAdornment> }}
              sx={{ maxWidth: 400 }}
            />
          </Stack>
        }
      >
        {tableData.map((row) => (
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

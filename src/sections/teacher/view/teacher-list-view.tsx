'use client';

import type { TeacherListItem } from 'src/types/services/teacher';

import { useState, useCallback, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useBoolean } from 'src/hooks/use-boolean';

import { TeacherService } from 'src/services/teacher';

import { DashboardContent } from 'src/layouts/dashboard';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable } from 'src/components/table';
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
  const table = useTable({ defaultOrderBy: 'name', defaultRowsPerPage: 10 });
  const confirm = useBoolean();

  const [tableData, setTableData] = useState<TeacherListItem[]>([]);
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

    TeacherService.list(params)
      .then((res) => {
        if (cancelled) return;
        setTableData((res as any).teachers ?? []);
        setTotal((res as any).count ?? 0);
      })
      .catch(() => { if (!cancelled) toast.error('Erro ao carregar professores'); })
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
        await TeacherService.delete(id);
        toast.success('Professor excluído');
        reload();
      } catch {
        toast.error('Erro ao excluir professor');
      }
    },
    [reload]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => TeacherService.delete(id)));
      toast.success('Professores excluídos');
      table.onSelectAllRows(false, []);
      reload();
    } catch {
      toast.error('Erro ao excluir professores');
    }
  }, [table, reload]);

  const notFound = !loading && tableData.length === 0;

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
        {tableData.map((row) => (
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

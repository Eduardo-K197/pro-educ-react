'use client';

import type { StudentListItem } from 'src/types/services/student';

import { useState, useCallback, useEffect } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useBoolean } from 'src/hooks/use-boolean';
import { useRolePermissions } from 'src/hooks/use-role-permissions';

import { varAlpha } from 'src/theme/styles';

import { StudentService } from 'src/services/student';

import { DashboardContent } from 'src/layouts/dashboard';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable } from 'src/components/table';
import { CustomTable } from 'src/components/list-table/list-table';

import { StudentTableRow } from '../student-table-row';

// ----------------------------------------------------------------------

// Valores exatos do enum StudentStatus no backend (português)
const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'Ativo', label: 'Ativos' },
  { value: 'Inativo', label: 'Inativos' },
  { value: 'Interessado', label: 'Interessados' },
  { value: 'Cancelado', label: 'Cancelados' },
];

const TABLE_HEAD = [
  { id: 'name', label: 'Aluno' },
  { id: 'courses', label: 'Cursos', width: 200 },
  { id: 'phone', label: 'Telefone', width: 140 },
  { id: 'birthDate', label: 'Nascimento', width: 130 },
  { id: 'status', label: 'Status', width: 100 },
  { id: '', width: 60 },
];

// ----------------------------------------------------------------------

export function StudentListView() {
  const table = useTable({ defaultOrderBy: 'name', defaultRowsPerPage: 10 });
  const confirm = useBoolean();
  const { canCreateStudent, canDeleteStudent } = useRolePermissions();

  const [tableData, setTableData] = useState<StudentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Ativo');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params: Record<string, any> = {
      page: table.page + 1,
      perPage: table.rowsPerPage,
    };
    if (search) params.search = search;
    if (status !== 'all') params.status = status;

    StudentService.list(params)
      .then((res) => {
        if (cancelled) return;
        setTableData((res as any).students ?? []);
        setTotal((res as any).count ?? 0);
      })
      .catch(() => { if (!cancelled) toast.error('Erro ao carregar alunos'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [table.page, table.rowsPerPage, search, status, refreshKey]);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleSearch = useCallback(
    (value: string) => { table.onResetPage(); setSearch(value); },
    [table]
  );

  const handleStatusChange = useCallback(
    (_: React.SyntheticEvent, value: string) => { table.onResetPage(); setStatus(value); },
    [table]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await StudentService.delete(id);
        toast.success('Aluno excluído');
        reload();
      } catch {
        toast.error('Erro ao excluir aluno');
      }
    },
    [reload]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => StudentService.delete(id)));
      toast.success('Alunos excluídos');
      table.onSelectAllRows(false, []);
      reload();
    } catch {
      toast.error('Erro ao excluir alunos');
    }
  }, [table, reload]);

  const notFound = !loading && tableData.length === 0;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Alunos"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Alunos', href: paths.dashboard.students.root },
          { name: 'Listagem' },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="soft"
              color="inherit"
              startIcon={<Iconify icon="solar:export-bold" />}
              onClick={() => {
                if (!tableData.length) return;
                const rows = tableData.map((s) => ({
                  Nome: s.name ?? '',
                  Email: s.email ?? '',
                  Telefone: s.phone ?? s.phoneNumber ?? '',
                  Nascimento: s.birthDate ? s.birthDate.substring(0, 10) : '',
                  Status: s.status ?? '',
                }));
                const headers = Object.keys(rows[0]);
                const csv = [
                  headers.join(';'),
                  ...rows.map((r) => headers.map((h) => `"${(r as any)[h]}"`).join(';')),
                ].join('\n');
                const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'alunos.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Exportar CSV
            </Button>
            {canCreateStudent && (
              <Button
                component={RouterLink}
                href={paths.dashboard.students.new}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                Novo aluno
              </Button>
            )}
          </Stack>
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
        onDeleteRows={canDeleteStudent ? handleDeleteRows : undefined}
        filters={
          <>
            <Tabs
              value={status}
              onChange={handleStatusChange}
              sx={{
                px: 2.5,
                boxShadow: (theme) =>
                  `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              }}
            >
              {STATUS_OPTIONS.map((tab) => (
                <Tab key={tab.value} value={tab.value} label={tab.label} />
              ))}
            </Tabs>

            <Stack sx={{ p: 2.5 }}>
              <TextField
                size="small"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar aluno..."
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
          </>
        }
      >
        {tableData.map((row) => (
          <StudentTableRow
            key={row.id}
            row={row}
            selected={table.selected.includes(String(row.id))}
            onSelectRow={() => table.onSelectRow(String(row.id))}
            onDeleteRow={() => handleDeleteRow(String(row.id))}
            canDelete={canDeleteStudent}
          />
        ))}
      </CustomTable>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Excluir alunos"
        content={<>Tem certeza que deseja excluir <strong>{table.selected.length}</strong> alunos?</>}
        action={
          <Button variant="contained" color="error" onClick={() => { handleDeleteRows(); confirm.onFalse(); }}>
            Excluir
          </Button>
        }
      />
    </DashboardContent>
  );
}

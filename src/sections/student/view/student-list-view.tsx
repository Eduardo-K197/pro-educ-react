'use client';
import MenuItem from '@mui/material/MenuItem';

import type { StudentListItem } from 'src/types/services/student';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';
import { useRolePermissions } from 'src/hooks/use-role-permissions';

import { studentTask, STUDENT_TASKS } from 'src/utils/student-journey';

import { varAlpha } from 'src/theme/styles';
import { StudentService } from 'src/services/student';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomTable } from 'src/components/list-table/list-table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ExportButton } from 'src/components/export-table/export-button';

import { StudentTableRow } from '../student-table-row';

// ----------------------------------------------------------------------

// Valores exatos do enum StudentStatus no backend (português)
const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'Ativo', label: 'Matriculados' },
  { value: 'Inativo', label: 'Inativos' },
  { value: 'Suspenso', label: 'Suspensos' },
  { value: 'Reservado', label: 'Reservados' },
  { value: 'Transferido', label: 'Transferidos' },
  { value: 'Interessado', label: 'Interessados' },
  { value: 'Cancelado', label: 'Desistentes' },
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
  const { canCreateStudent, canDeleteStudent, role } = useRolePermissions();

  const [tableData, setTableData] = useState<StudentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pendingQuery = useRef(searchParams.toString());
  useEffect(() => { pendingQuery.current = searchParams.toString(); }, [searchParams]);
  const search = searchParams.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(search);
  const task = studentTask(searchParams.get('task'));
  const [loadError, setLoadError] = useState(false);
  useEffect(() => { setSearchInput(search); }, [search]);
  const writeQuery = (changes: Record<string, string>) => {
    const query = new URLSearchParams(pendingQuery.current);
    Object.entries(changes).forEach(([key, value]) => { if (value) query.set(key, value); else query.delete(key); });
    pendingQuery.current = query.toString();
    router.replace(`${pathname}${query.size ? `?${query}` : ''}`, { scroll: false });
    table.onResetPage();
  };
  const tag=searchParams.get('tag')??'';
  const birthStart = searchParams.get('bornFrom') ?? '';
  const birthEnd = searchParams.get('bornTo') ?? '';
  const status = STATUS_OPTIONS.some((option) => option.value === searchParams.get('status')) ? searchParams.get('status')! : search ? 'all' : 'Ativo';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    if (birthStart && birthEnd && birthStart > birthEnd) { setTableData([]); setTotal(0); setLoading(false); return undefined; }

    const params: Record<string, any> = {
      page: table.page + 1,
      perPage: table.rowsPerPage,
    };
    if (birthStart) params['birthDate[ge]'] = birthStart;
    if (birthEnd) params['birthDate[le]'] = birthEnd;
    if (search) params.search = search;
    if(tag)params.tag=tag;
    if (status !== 'all') params.status = status;

    StudentService.list(params)
      .then((res) => {
        if (cancelled) return;
        const students = res.students ?? [];
        if (role === 'teacher') {
          // This API branch returns the teacher's scoped list without applying these filters.
          const matches = students.filter((student) => (!search || student.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')) || student.cpf?.includes(search)) && (status === 'all' || student.status === status) && (!tag||student.tags?.includes(tag)) && (!birthStart || !!student.birthDate && student.birthDate.slice(0, 10) >= birthStart) && (!birthEnd || !!student.birthDate && student.birthDate.slice(0, 10) <= birthEnd));
          setTableData(matches.slice(table.page * table.rowsPerPage, (table.page + 1) * table.rowsPerPage)); setTotal(matches.length);
        } else { setTableData(students); setTotal(res.count ?? 0); }
      })
      .catch(() => { if (!cancelled) { setTableData([]); setTotal(0); setLoadError(true); } })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [table.page, table.rowsPerPage, search, status, refreshKey, birthStart, birthEnd, role, tag]);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault(); writeQuery({ search: searchInput.trim(), status });
  };
  const clearFilters = () => {
    setSearchInput(''); writeQuery({ search: '', status: 'all', bornFrom: '', bornTo: '', tag:'' });
  };

  const handleStatusChange = (_event: React.SyntheticEvent, value: string) => writeQuery({ status: value });

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

  const notFound = !loading && !loadError && tableData.length === 0;
  const hasFilters = !!search || !!birthStart || !!birthEnd || status !== 'all';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Alunos"
        description="Encontre o cadastro antes de criar um novo. Escolha a tarefa para continuar o atendimento na ficha certa."
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Alunos', href: paths.dashboard.students.root },
          { name: 'Listagem' },
        ]}
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <ExportButton resource="students" disabled={loading || loadError} initialFilters={{ search, status, tag: tag || undefined, ...(birthStart || birthEnd ? { dateField: 'birthDate', from: birthStart || undefined, to: birthEnd || undefined } : {}) }} />
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

      <Box component="section" aria-label="Tarefa do atendimento" sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: 'background.neutral', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>O que você vai resolver?</Typography>
        <ToggleButtonGroup exclusive value={task.id} aria-label="Tarefa do aluno" onChange={(_, value) => { if (value) writeQuery({ task: value, search: searchInput.trim(), status }); }} sx={{ gap: 1, flexWrap: 'wrap', '& .MuiToggleButton-root': { border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', m: '0 !important', textTransform: 'none', px: 1.5, minHeight: 40 } }}>
          {STUDENT_TASKS.filter((item) => item.id !== 'payments' || role !== 'teacher').map((item) => <ToggleButton key={item.id} value={item.id}><Iconify icon={item.icon} width={18} sx={{ mr: 0.75 }} />{item.title}</ToggleButton>)}
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Ao selecionar o aluno: {task.description}</Typography>
      </Box>
      {loadError && <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" onClick={reload}>Tentar novamente</Button>}>Não foi possível carregar os alunos. Confira a conexão e tente novamente; isso não significa que o cadastro não exista.</Alert>}
      <CustomTable
        table={table}
        studentMobileLayout
        dataFiltered={tableData}
        tableHead={TABLE_HEAD}
        notFound={notFound}
        emptyTitle="Nenhum aluno encontrado"
        emptyDescription={hasFilters ? 'Tente outro nome ou CPF ou limpe os filtros para procurar em todos os status.' : 'Ainda não há alunos cadastrados para esta escola.'}
        emptyAction={hasFilters ? <Button onClick={clearFilters} variant="outlined" sx={{ mt: 2 }}>Limpar busca e filtros</Button> : canCreateStudent ? <Button component={RouterLink} href={paths.dashboard.students.new} variant="contained" sx={{ mt: 2 }}>Cadastrar aluno</Button> : undefined}
        loading={loading}
        totalCount={total}
        onDeleteRows={canDeleteStudent ? confirm.onTrue : undefined}
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

            <Stack component="form" onSubmit={handleSearch} sx={{ p: 2.5 }} direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                size="small"
                label="Nome ou CPF"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Digite para localizar um aluno"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: { md: 260 }, flexGrow: 1 }}
              />
              <TextField size="small" label="Filtrar por tag" value={tag} onChange={event=>writeQuery({tag:event.target.value})}/>
              <Button type="submit" variant="contained" startIcon={<Iconify icon="eva:search-fill" />} sx={{ minHeight: 40 }}>Buscar alunos</Button>
              <TextField size="small" type="date" label="Nascimento de" InputLabelProps={{ shrink: true }} value={birthStart} onChange={(event) => writeQuery({ bornFrom: event.target.value })} />
              <TextField size="small" type="date" label="Nascimento até" InputLabelProps={{ shrink: true }} value={birthEnd} onChange={(event) => writeQuery({ bornTo: event.target.value })} error={!!birthStart && !!birthEnd && birthStart > birthEnd} helperText={birthStart && birthEnd && birthStart > birthEnd ? 'O fim deve ser igual ou posterior ao início.' : undefined} />
              {(birthStart || birthEnd) && <Button onClick={() => writeQuery({ bornFrom: '', bornTo: '' })}>Limpar datas</Button>}
            </Stack>
          </>
        }
      >
        {tableData.map((row) => (
          <StudentTableRow
            key={row.id}
            row={row}
            task={task.id}
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

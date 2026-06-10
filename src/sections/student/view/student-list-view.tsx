'use client';

import type { StudentListItem, IStudentTableFilters } from 'src/types/services/student';

import { useState, useCallback, useEffect } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';
import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';
import { useRolePermissions } from 'src/hooks/use-role-permissions';

import { varAlpha } from 'src/theme/styles';

import { StudentService } from 'src/services/student';

import { DashboardContent } from 'src/layouts/dashboard';
import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, getComparator, rowInPage } from 'src/components/table';
import { CustomTable } from 'src/components/list-table/list-table';

import { StudentTableRow } from '../student-table-row';
import { StudentTableToolbar } from '../student-table-toolbar';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
  { value: 'suspended', label: 'Suspensos' },
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
  const table = useTable({ defaultOrderBy: 'name' });
  const router = useRouter();
  const confirm = useBoolean();
  const { canCreateStudent, canDeleteStudent } = useRolePermissions();

  const [tableData, setTableData] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = useSetState<IStudentTableFilters>({
    name: '',
    status: 'all',
    startDate: null,
    endDate: null,
  });

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await StudentService.list();
      const students = (res as any).students ?? res ?? [];
      setTableData(students);
    } catch {
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);
  const canReset = !!filters.state.name || filters.state.status !== 'all';
  const notFound = !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await StudentService.delete(id);
        setTableData((prev) => prev.filter((r) => String(r.id) !== id));
        toast.success('Aluno excluído');
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch {
        toast.error('Erro ao excluir aluno');
      }
    },
    [dataInPage.length, table]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => StudentService.delete(id)));
      setTableData((prev) => prev.filter((r) => !table.selected.includes(String(r.id))));
      toast.success('Alunos excluídos');
      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });
    } catch {
      toast.error('Erro ao excluir alunos');
    }
  }, [dataFiltered.length, dataInPage.length, table]);

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
          canCreateStudent && (
            <Button
              component={RouterLink}
              href={paths.dashboard.students.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Novo aluno
            </Button>
          )
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CustomTable
        table={table}
        dataFiltered={dataFiltered}
        tableHead={TABLE_HEAD}
        notFound={notFound}
        onDeleteRows={canDeleteStudent ? handleDeleteRows : undefined}
        filters={
          <>
            <Tabs
              value={filters.state.status}
              onChange={(_, v) => {
                table.onResetPage();
                filters.setState({ status: v });
              }}
              sx={{
                px: 2.5,
                boxShadow: (theme) =>
                  `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              }}
            >
              {STATUS_OPTIONS.map((tab) => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  label={tab.label}
                  iconPosition="end"
                  icon={
                    <Label
                      variant={
                        tab.value === 'all' || tab.value === filters.state.status
                          ? 'filled'
                          : 'soft'
                      }
                      color={
                        (tab.value === 'active' && 'success') ||
                        (tab.value === 'inactive' && 'default') ||
                        (tab.value === 'suspended' && 'error') ||
                        'default'
                      }
                    >
                      {tab.value === 'all'
                        ? tableData.length
                        : tableData.filter((s) => s.status === tab.value).length}
                    </Label>
                  }
                />
              ))}
            </Tabs>

            <StudentTableToolbar filters={filters} onResetPage={table.onResetPage} />
          </>
        }
      >
        {dataFiltered
          .slice(table.page * table.rowsPerPage, table.page * table.rowsPerPage + table.rowsPerPage)
          .map((row) => (
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

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: StudentListItem[];
  filters: IStudentTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { name, status } = filters;

  const stabilized = inputData.map((el, index) => [el, index] as const);
  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    return order !== 0 ? order : a[1] - b[1];
  });
  inputData = stabilized.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (s) =>
        s.name.toLowerCase().includes(name.toLowerCase()) ||
        (s.email ?? '').toLowerCase().includes(name.toLowerCase())
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((s) => (s.status ?? 'active') === status);
  }

  return inputData;
}

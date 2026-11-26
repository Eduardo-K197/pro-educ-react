'use client';

import type { CrmDepartment, CrmDepartmentPayload } from 'src/types/services/crm';

import { useState, useEffect, useCallback } from 'react';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { CrmService } from 'src/services/crm';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomTable } from 'src/components/list-table/list-table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CrmAccessGuard } from '../crm-access-guard';
import { CrmDepartmentTableRow } from '../crm-department-table-row';
import { CrmDepartmentFormDialog } from '../crm-department-form-dialog';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Setor' },
  { id: 'memberCount', label: 'Membros', width: 120 },
  { id: 'active', label: 'Status', width: 120 },
  { id: '', width: 60 },
];

export function CrmDepartmentListView() {
  return (
    <DashboardContent>
      <CrmAccessGuard min="gestor">
        <CrmDepartmentList />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

function CrmDepartmentList() {
  const table = useTable({ defaultOrderBy: 'name', defaultRowsPerPage: 10 });
  const confirm = useBoolean();
  const form = useBoolean();

  const [tableData, setTableData] = useState<CrmDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState<CrmDepartment | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    CrmService.listDepartments()
      .then((data) => {
        if (!cancelled) setTableData(data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err?.message || 'Erro ao carregar setores');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  const openCreate = useCallback(() => {
    setEditing(null);
    form.onTrue();
  }, [form]);

  const openEdit = useCallback(
    (row: CrmDepartment) => {
      setEditing(row);
      form.onTrue();
    },
    [form]
  );

  const handleSubmit = useCallback(
    async (payload: CrmDepartmentPayload) => {
      try {
        if (editing) {
          await CrmService.updateDepartment(editing.id, payload);
          toast.success('Setor atualizado');
        } else {
          await CrmService.createDepartment(payload);
          toast.success('Setor criado');
        }
        form.onFalse();
        reload();
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao salvar setor');
      }
    },
    [editing, form, reload]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await CrmService.deleteDepartment(id);
        toast.success('Setor excluído');
        reload();
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao excluir setor');
      }
    },
    [reload]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => CrmService.deleteDepartment(id)));
      toast.success('Setores excluídos');
      table.onSelectAllRows(false, []);
      reload();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao excluir setores');
    }
  }, [table, reload]);

  const pageRows = tableData.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  return (
    <>
      <CustomBreadcrumbs
        heading="Setores"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'CRM', href: paths.dashboard.crm.root },
          { name: 'Setores' },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={openCreate}
          >
            Novo setor
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CustomTable
        table={table}
        dataFiltered={tableData}
        tableHead={TABLE_HEAD}
        notFound={!loading && tableData.length === 0}
        emptyTitle="Nenhum setor cadastrado"
        emptyDescription="Crie setores para organizar a fila de atendimento (ex.: Secretaria, Financeiro)."
        loading={loading}
        totalCount={tableData.length}
        onDeleteRows={confirm.onTrue}
      >
        {pageRows.map((row) => (
          <CrmDepartmentTableRow
            key={row.id}
            row={row}
            selected={table.selected.includes(row.id)}
            onSelectRow={() => table.onSelectRow(row.id)}
            onEditRow={() => openEdit(row)}
            onDeleteRow={() => handleDeleteRow(row.id)}
          />
        ))}
      </CustomTable>

      <CrmDepartmentFormDialog
        open={form.value}
        current={editing}
        onClose={form.onFalse}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Excluir setores"
        content={
          <>
            Tem certeza? <strong>{table.selected.length}</strong> setores serão excluídos.
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Excluir
          </Button>
        }
      />
    </>
  );
}

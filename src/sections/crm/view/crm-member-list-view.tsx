'use client';

import type {
  CrmMember,
  CrmCandidate,
  CrmDepartment,
  CrmMemberCreatePayload,
  CrmMemberUpdatePayload,
} from 'src/types/services/crm';

import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

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
import { CrmMemberTableRow } from '../crm-member-table-row';
import { CrmMemberFormDialog } from '../crm-member-form-dialog';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Membro' },
  { id: 'role', label: 'Papel', width: 130 },
  { id: 'departments', label: 'Setores', width: 260 },
  { id: 'active', label: 'Status', width: 110 },
  { id: '', width: 60 },
];

export function CrmMemberListView() {
  return (
    <DashboardContent>
      <CrmAccessGuard min="gestor">
        <CrmMemberList />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

/** Lista de membros; `embedded` = sem breadcrumbs (usada nas configurações do Growth). */
export function CrmMemberList({ embedded = false }: { embedded?: boolean }) {
  const table = useTable({ defaultOrderBy: 'name', defaultRowsPerPage: 10 });
  const confirm = useBoolean();
  const form = useBoolean();

  const [tableData, setTableData] = useState<CrmMember[]>([]);
  const [candidates, setCandidates] = useState<CrmCandidate[]>([]);
  const [departments, setDepartments] = useState<CrmDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState<CrmMember | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      CrmService.listMembers(),
      CrmService.listCandidates(),
      CrmService.listDepartments(),
    ])
      .then(([members, users, depts]) => {
        if (cancelled) return;
        setTableData(members);
        setCandidates(users);
        setDepartments(depts.filter((d) => d.active));
      })
      .catch((err) => {
        if (!cancelled) toast.error(err?.message || 'Erro ao carregar membros');
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
    (row: CrmMember) => {
      setEditing(row);
      form.onTrue();
    },
    [form]
  );

  const handleCreate = useCallback(
    async (payload: CrmMemberCreatePayload) => {
      try {
        await CrmService.createMember(payload);
        toast.success('Membro adicionado');
        form.onFalse();
        reload();
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao adicionar membro');
      }
    },
    [form, reload]
  );

  const handleUpdate = useCallback(
    async (id: string, payload: CrmMemberUpdatePayload) => {
      try {
        await CrmService.updateMember(id, payload);
        toast.success('Membro atualizado');
        form.onFalse();
        reload();
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao atualizar membro');
      }
    },
    [form, reload]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await CrmService.deleteMember(id);
        toast.success('Membro removido');
        reload();
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao remover membro');
      }
    },
    [reload]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => CrmService.deleteMember(id)));
      toast.success('Membros removidos');
      table.onSelectAllRows(false, []);
      reload();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao remover membros');
    }
  }, [table, reload]);

  const pageRows = tableData.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  return (
    <>
      {embedded ? (
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
          <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={openCreate}>
            Adicionar membro
          </Button>
        </Stack>
      ) : (
        <CustomBreadcrumbs
          heading="Membros"
          links={[
            { name: 'Painel', href: paths.dashboard.root },
            { name: 'CRM', href: paths.dashboard.crm.root },
            { name: 'Membros' },
          ]}
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={openCreate}
            >
              Adicionar membro
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />
      )}

      <Stack sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Administradores da escola já são gestores do CRM e do Growth automaticamente e não
          precisam ser cadastrados aqui.
        </Typography>
      </Stack>

      <CustomTable
        table={table}
        dataFiltered={tableData}
        tableHead={TABLE_HEAD}
        notFound={!loading && tableData.length === 0}
        emptyTitle="Nenhum membro na equipe"
        emptyDescription="Adicione funcionários ou professores que vão atender pelo CRM."
        loading={loading}
        totalCount={tableData.length}
        onDeleteRows={confirm.onTrue}
      >
        {pageRows.map((row) => (
          <CrmMemberTableRow
            key={row.id}
            row={row}
            selected={table.selected.includes(row.id)}
            onSelectRow={() => table.onSelectRow(row.id)}
            onEditRow={() => openEdit(row)}
            onDeleteRow={() => handleDeleteRow(row.id)}
          />
        ))}
      </CustomTable>

      <CrmMemberFormDialog
        open={form.value}
        current={editing}
        candidates={candidates}
        departments={departments}
        onClose={form.onFalse}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Remover membros"
        content={
          <>
            Tem certeza? <strong>{table.selected.length}</strong> membros serão removidos do CRM.
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
            Remover
          </Button>
        }
      />
    </>
  );
}

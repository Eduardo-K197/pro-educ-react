'use client';

import type { CrmTask } from 'src/types/services/crm-deal';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { paths } from 'src/routes/paths';

import { CrmService } from 'src/services/crm';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CrmAccessGuard } from '../crm-access-guard';
import { useCrmAccess } from '../crm-access-context';
import { upsertTask } from '../deals/crm-deal-utils';
import { CrmTaskList } from '../deals/crm-task-list';
import { CrmTaskDialog } from '../deals/crm-task-dialog';

// ----------------------------------------------------------------------

export function CrmTaskListView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs heading="Minhas tarefas" links={[{ name: 'CRM', href: paths.dashboard.crm.root }, { name: 'Tarefas' }]} sx={{ mb: { xs: 3, md: 5 } }} />
      <CrmAccessGuard min="agente">
        <Tasks />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

function Tasks() {
  const { can } = useCrmAccess();
  const canSupervise = can('supervisor');
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [status, setStatus] = useState('open');
  const [due, setDue] = useState('');
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [dialog, setDialog] = useState<{ task: CrmTask | null } | null>(null);

  const load = useCallback(() => {
    CrmService.listTasks({ scope, status, due: due || undefined })
      .then(setTasks)
      .catch((err) => toast.error(err?.message || 'Erro ao carregar tarefas'));
  }, [scope, status, due]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        {canSupervise && (
          <TextField select size="small" label="De quem" value={scope} onChange={(e) => setScope(e.target.value as 'mine' | 'all')} sx={{ minWidth: 160 }}>
            <MenuItem value="mine">Minhas</MenuItem>
            <MenuItem value="all">Toda a equipe</MenuItem>
          </TextField>
        )}
        <TextField select size="small" label="Situação" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="open">Abertas</MenuItem>
          <MenuItem value="done">Concluídas</MenuItem>
          <MenuItem value="canceled">Canceladas</MenuItem>
        </TextField>
        <TextField select size="small" label="Prazo" value={due} onChange={(e) => setDue(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">Qualquer</MenuItem>
          <MenuItem value="overdue">Atrasadas</MenuItem>
          <MenuItem value="today">Até hoje</MenuItem>
          <MenuItem value="week">Próximos 7 dias</MenuItem>
        </TextField>
        <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={() => setDialog({ task: null })} sx={{ ml: { sm: 'auto' } }}>
          Nova tarefa
        </Button>
      </Stack>
      <CrmTaskList
        tasks={tasks}
        showDeal
        showAssignee={scope === 'all'}
        onChange={(task) => setTasks((list) => (task.status !== status ? list.filter((t) => t.id !== task.id) : upsertTask(list, task)))}
        onRemove={(taskId) => setTasks((list) => list.filter((t) => t.id !== taskId))}
        onEdit={(task) => setDialog({ task })}
        emptyText={status === 'open' ? 'Nenhuma tarefa aberta. Tudo em dia!' : 'Nenhuma tarefa.'}
      />
      <CrmTaskDialog
        open={!!dialog}
        task={dialog?.task ?? null}
        onClose={() => setDialog(null)}
        onSaved={(task) => setTasks((list) => upsertTask(list, task))}
        canSupervise={canSupervise}
      />
    </Card>
  );
}

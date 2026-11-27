'use client';

import type { CrmTask } from 'src/types/services/crm-deal';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import { CrmService } from 'src/services/crm';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  tasks: CrmTask[];
  onChange: (task: CrmTask) => void;
  onRemove: (taskId: string) => void;
  onEdit: (task: CrmTask) => void;
  showDeal?: boolean;
  showAssignee?: boolean;
  emptyText?: string;
};

/** Lista de tarefas com conclusão em um clique. */
export function CrmTaskList({ tasks, onChange, onRemove, onEdit, showDeal, showAssignee, emptyText = 'Nenhuma tarefa.' }: Props) {
  const toggle = async (task: CrmTask) => {
    try {
      onChange(await CrmService.updateTask(task.id, { status: task.status === 'done' ? 'open' : 'done' }));
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível atualizar a tarefa.');
    }
  };

  const remove = async (task: CrmTask) => {
    try {
      await CrmService.deleteTask(task.id);
      onRemove(task.id);
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível remover a tarefa.');
    }
  };

  if (!tasks.length) {
    return (
      <Typography variant="body2" sx={{ color: 'text.disabled', py: 1 }}>
        {emptyText}
      </Typography>
    );
  }

  return (
    <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
      {tasks.map((t) => (
        <Stack key={t.id} direction="row" alignItems="flex-start" spacing={1} sx={{ py: 1 }}>
          <Checkbox
            checked={t.status === 'done'}
            onChange={() => toggle(t)}
            disabled={t.status === 'canceled'}
            inputProps={{ 'aria-label': t.status === 'done' ? 'Reabrir tarefa' : 'Concluir tarefa' }}
            sx={{ mt: -0.5 }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? 'text.disabled' : 'text.primary' }}
            >
              {t.title}
            </Typography>
            {t.description && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', whiteSpace: 'pre-wrap' }}>
                {t.description}
              </Typography>
            )}
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.5 }}>
              {t.dueAt && (
                <Label color={t.overdue ? 'error' : t.status === 'done' ? 'default' : 'info'} variant="soft">
                  {t.overdue ? 'Atrasada · ' : ''}
                  {fDateTime(t.dueAt, 'DD/MM HH:mm')}
                </Label>
              )}
              {showAssignee && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t.assignee.name ?? 'Responsável'}
                </Typography>
              )}
              {showDeal && t.deal && (
                <Link component={RouterLink} href={paths.dashboard.crm.lead(t.deal.id)} variant="caption">
                  {t.deal.title}
                </Link>
              )}
            </Stack>
          </Box>
          <IconButton size="small" onClick={() => onEdit(t)} aria-label="Editar tarefa">
            <Iconify icon="solar:pen-bold" width={16} />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => remove(t)} aria-label="Remover tarefa">
            <Iconify icon="solar:trash-bin-trash-bold" width={16} />
          </IconButton>
        </Stack>
      ))}
    </Stack>
  );
}

'use client';

import type { CrmTask, CrmDealDetail, CrmDealSocketPayload } from 'src/types/services/crm-deal';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fDateTime } from 'src/utils/format-time';

import { useCrmSocketEvent } from 'src/lib/socket';
import { GrowthService } from 'src/services/growth';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { formatPhone } from 'src/sections/crm/inbox/utils';
import { CrmAccessGuard } from 'src/sections/crm/crm-access-guard';
import { useCrmAccess } from 'src/sections/crm/crm-access-context';

import { isDeletedDeal, CRM_DEAL_SOURCE_LABELS, CRM_DEAL_STATUS_LABELS } from 'src/types/services/crm-deal';

import { CrmTaskList } from '../components/task-list';
import { CrmTaskDialog } from '../components/task-dialog';
import { daysSince, upsertTask } from '../components/deal-utils';
import { CrmDealFormDialog } from '../components/deal-form-dialog';
import { CrmDealLostDialog } from '../components/deal-lost-dialog';
import { CrmDealConvertDialog } from '../components/deal-convert-dialog';

// ----------------------------------------------------------------------

export function GrowthLeadDetailsView({ id }: { id: string }) {
  return (
    <DashboardContent>
      <CrmAccessGuard min="agente">
        <LeadDetails id={id} />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

const EVENT_ICONS: Record<string, string> = {
  created: 'solar:star-bold',
  stage: 'solar:arrow-right-bold',
  owner: 'solar:user-id-bold',
  updated: 'solar:pen-bold',
  won: 'solar:cup-star-bold',
  lost: 'solar:close-circle-bold',
  reopened: 'solar:restart-bold',
  converted: 'solar:diploma-verified-bold',
  linked: 'solar:link-bold',
  task_done: 'solar:check-circle-bold',
  note: 'solar:notes-bold',
};

const STATUS_COLOR = { open: 'info', won: 'success', lost: 'error' } as const;

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1}>
      <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 140 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Stack>
  );
}

function LeadDetails({ id }: { id: string }) {
  const router = useRouter();
  const { me, can } = useCrmAccess();
  const canSupervise = can('supervisor');
  const [detail, setDetail] = useState<CrmDealDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  const [losing, setLosing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [taskDialog, setTaskDialog] = useState<{ task: CrmTask | null } | null>(null);

  const load = useCallback(() => {
    GrowthService.getDeal(id)
      .then((d) => {
        setDetail(d);
        setError(null);
      })
      .catch((err) => setError(err?.message || 'Lead não encontrado'));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useCrmSocketEvent<CrmDealSocketPayload>('crm:deal:updated', ({ deal, reason }) => {
    if (deal.id !== id) return;
    if (isDeletedDeal(deal)) {
      setError('Este lead foi excluído.');
      return;
    }
    if (reason !== 'interaction') load();
    else setDetail((d) => (d ? { ...d, deal } : d));
  });

  if (error) return <Alert severity="warning">{error}</Alert>;
  if (!detail) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 8 }} />;

  const { deal, pipeline, events, notes, tasks, convertedStudent } = detail;
  const stages = pipeline.stages.filter((s) => s.active);
  const mine = deal.owner?.id === me?.user.id;
  const canChange = canSupervise || mine || !deal.owner;

  const move = async (stageId: string, lostReason?: string) => {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) return;
    if (stage.kind === 'lost' && !lostReason) {
      setLosing(true);
      return;
    }
    if (stage.kind === 'won' && !deal.convertedStudentId) {
      setConverting(true);
      return;
    }
    try {
      await GrowthService.moveDeal(deal.id, stageId, lostReason);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível mover o lead.');
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    try {
      await GrowthService.addDealNote(deal.id, note.trim());
      setNote('');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível salvar a nota.');
    }
  };

  const removeNote = async (noteId: string) => {
    try {
      await GrowthService.deleteDealNote(deal.id, noteId);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível apagar a nota.');
    }
  };

  const remove = async () => {
    try {
      await GrowthService.deleteDeal(deal.id);
      toast.success('Lead excluído.');
      router.push(paths.dashboard.growth.funnel);
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível excluir.');
    }
  };

  const timeline = [
    ...events.map((e) => ({ key: `e-${e.id}`, type: e.type, text: e.text ?? '', author: e.author?.name ?? null, at: e.createdAt, noteId: null as string | null, mine: false })),
    ...notes.map((n) => ({
      key: `n-${n.id}`,
      type: 'note',
      text: n.body,
      author: n.author.name,
      at: n.createdAt,
      noteId: n.id,
      mine: n.author.id === me?.user.id,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const idle = daysSince(deal.lastInteractionAt);

  return (
    <>
      <CustomBreadcrumbs
        heading={deal.title}
        links={[{ name: 'Growth', href: paths.dashboard.growth.root }, { name: 'Funil', href: paths.dashboard.growth.funnel }, { name: deal.title }]}
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {deal.conversationId && (
              <Button variant="outlined" component={RouterLink} href={`${paths.dashboard.crm.inbox}?id=${deal.conversationId}`} startIcon={<Iconify icon="solar:chat-round-dots-bold" />}>
                Conversa
              </Button>
            )}
            {canChange && (
              <Button variant="outlined" onClick={() => setEditing(true)} startIcon={<Iconify icon="solar:pen-bold" />}>
                Editar
              </Button>
            )}
            {canChange && deal.status !== 'lost' && !deal.convertedStudentId && (
              <Button variant="outlined" color="error" onClick={() => setLosing(true)}>
                Perdido
              </Button>
            )}
            {canChange && !deal.convertedStudentId && (
              <Button variant="contained" color="success" onClick={() => setConverting(true)} startIcon={<Iconify icon="solar:diploma-verified-bold" />}>
                Converter em matrícula
              </Button>
            )}
            {canSupervise && (
              <IconButton color="error" onClick={() => setDeleting(true)} aria-label="Excluir lead">
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            )}
          </Stack>
        }
        sx={{ mb: 3 }}
      />

      <Grid container spacing={3}>
        <Grid xs={12} md={5}>
          <Stack spacing={3}>
            <Card sx={{ p: 2.5 }}>
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Label variant="soft" color={STATUS_COLOR[deal.status]}>
                    {CRM_DEAL_STATUS_LABELS[deal.status]}
                  </Label>
                  {deal.stage && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {pipeline.name} · {deal.stage.probability}%
                    </Typography>
                  )}
                </Stack>
                <TextField select size="small" label="Etapa" value={deal.stageId} onChange={(e) => move(e.target.value)} disabled={!canChange}>
                  {stages.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      <Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color, display: 'inline-block', mr: 1 }} />
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>
                {deal.status === 'lost' && deal.lostReason && <Alert severity="error">Motivo da perda: {deal.lostReason}</Alert>}
                {convertedStudent && (
                  <Alert severity="success">
                    Matriculado:{' '}
                    <Link component={RouterLink} href={paths.dashboard.students.details(String(convertedStudent.id))}>
                      {convertedStudent.name}
                    </Link>
                    {deal.convertedAt ? ` em ${fDate(deal.convertedAt)}` : ''}
                  </Alert>
                )}
                <Divider />
                <Typography variant="subtitle2">Aluno interessado</Typography>
                <Info label="Nome" value={deal.studentName} />
                <Info label="Nascimento" value={deal.studentBirthDate ? fDate(deal.studentBirthDate) : null} />
                <Info label="Série / curso" value={deal.interestLabel} />
                <Divider />
                <Typography variant="subtitle2">Responsável</Typography>
                <Info label="Nome" value={deal.guardianName} />
                <Info label="Telefone" value={deal.guardianPhone ? formatPhone(deal.guardianPhone) || deal.guardianPhone : null} />
                <Info label="E-mail" value={deal.guardianEmail} />
                {deal.contact && <Info label="Contato WhatsApp" value={deal.contact.name} />}
                <Divider />
                <Typography variant="subtitle2">Negociação</Typography>
                <Info label="Responsável comercial" value={deal.owner?.name} />
                <Info label="Origem" value={deal.source ? CRM_DEAL_SOURCE_LABELS[deal.source] ?? deal.source : null} />
                <Info label="Valor estimado" value={deal.estimatedValue != null ? fCurrency(deal.estimatedValue) : null} />
                <Info label="Valor ponderado" value={deal.weightedValue != null && deal.estimatedValue != null ? fCurrency(deal.weightedValue) : null} />
                <Info label="Previsão" value={deal.expectedCloseAt ? fDate(deal.expectedCloseAt) : null} />
                <Info label="Última interação" value={deal.lastInteractionAt ? `${fDateTime(deal.lastInteractionAt, 'DD/MM/YYYY HH:mm')}${idle ? ` (há ${idle} dia(s))` : ''}` : null} />
                <Info label="Criado em" value={fDateTime(deal.createdAt, 'DD/MM/YYYY HH:mm')} />
                {!!deal.tags.length && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {deal.tags.map((t) => (
                      <Label key={t.id} sx={{ bgcolor: t.color, color: 'common.white' }}>
                        {t.name}
                      </Label>
                    ))}
                  </Stack>
                )}
                {deal.description && (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
                    {deal.description}
                  </Typography>
                )}
              </Stack>
            </Card>

            <Card sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6" sx={{ flex: 1 }}>
                  Tarefas
                </Typography>
                <Button size="small" startIcon={<Iconify icon="mingcute:add-line" />} onClick={() => setTaskDialog({ task: null })}>
                  Nova tarefa
                </Button>
              </Stack>
              <CrmTaskList
                tasks={tasks}
                showAssignee
                onChange={(task) => setDetail((d) => (d ? { ...d, tasks: upsertTask(d.tasks, task) } : d))}
                onRemove={(taskId) => setDetail((d) => (d ? { ...d, tasks: d.tasks.filter((t) => t.id !== taskId) } : d))}
                onEdit={(task) => setTaskDialog({ task })}
                emptyText="Nenhuma tarefa. Agende o próximo contato."
              />
            </Card>
          </Stack>
        </Grid>

        <Grid xs={12} md={7}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Histórico e notas
            </Typography>
            <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                placeholder="Escreva uma nota interna..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                inputProps={{ maxLength: 5000 }}
              />
              <Button variant="contained" onClick={addNote} disabled={!note.trim()}>
                Salvar
              </Button>
            </Stack>
            <Stack spacing={2}>
              {timeline.map((item) => (
                <Stack key={item.key} direction="row" spacing={1.5}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: item.type === 'note' ? 'warning.lighter' : 'background.neutral',
                      color: item.type === 'lost' ? 'error.main' : item.type === 'won' || item.type === 'converted' ? 'success.main' : 'text.secondary',
                    }}
                  >
                    <Iconify icon={EVENT_ICONS[item.type] ?? 'solar:record-bold'} width={16} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {item.text}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {item.author ? `${item.author} · ` : ''}
                      {fDateTime(item.at, 'DD/MM/YYYY HH:mm')}
                    </Typography>
                  </Box>
                  {item.noteId && (item.mine || canSupervise) && (
                    <IconButton size="small" onClick={() => removeNote(item.noteId!)} aria-label="Apagar nota">
                      <Iconify icon="solar:trash-bin-trash-bold" width={14} />
                    </IconButton>
                  )}
                </Stack>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <CrmDealFormDialog open={editing} onClose={() => setEditing(false)} onSaved={load} deal={deal} pipeline={pipeline} canSupervise={canSupervise} />
      <CrmDealLostDialog
        open={losing}
        onClose={() => setLosing(false)}
        onConfirm={async (reason) => {
          const lost = stages.find((s) => s.kind === 'lost');
          if (lost) await move(lost.id, reason);
          setLosing(false);
        }}
      />
      <CrmDealConvertDialog
        open={converting}
        deal={deal}
        onClose={() => setConverting(false)}
        onConverted={load}
        onWonWithoutStudent={async () => {
          const won = stages.find((s) => s.kind === 'won');
          setConverting(false);
          if (!won) return;
          try {
            await GrowthService.moveDeal(deal.id, won.id);
            load();
          } catch (err: any) {
            toast.error(err?.message || 'Não foi possível mover o lead.');
          }
        }}
      />
      <CrmTaskDialog
        open={!!taskDialog}
        task={taskDialog?.task ?? null}
        dealId={deal.id}
        onClose={() => setTaskDialog(null)}
        onSaved={(task) => setDetail((d) => (d ? { ...d, tasks: upsertTask(d.tasks, task) } : d))}
        canSupervise={canSupervise}
      />
      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Excluir lead"
        content="O lead sai do funil e das listas. O histórico fica guardado no banco."
        action={
          <Button variant="contained" color="error" onClick={remove}>
            Excluir
          </Button>
        }
      />
    </>
  );
}

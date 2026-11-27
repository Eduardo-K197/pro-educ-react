'use client';

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { CrmDeal, CrmPipeline, CrmPipelineStage, CrmDealSocketPayload } from 'src/types/services/crm-deal';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSensor, DndContext, useSensors, DragOverlay, TouchSensor, useDroppable, PointerSensor } from '@dnd-kit/core';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { fCurrency } from 'src/utils/format-number';

import { CrmService } from 'src/services/crm';
import { useCrmSocketEvent } from 'src/lib/socket';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { isDeletedDeal, CRM_DEAL_SOURCES } from 'src/types/services/crm-deal';

import { CrmAccessGuard } from '../crm-access-guard';
import { useCrmAccess } from '../crm-access-context';
import { upsertDeal } from '../deals/crm-deal-utils';
import { CrmDealFormDialog } from '../deals/crm-deal-form-dialog';
import { CrmDealLostDialog } from '../deals/crm-deal-lost-dialog';
import { CrmDealConvertDialog } from '../deals/crm-deal-convert-dialog';
import { CrmDealCard, CrmDealCardContent } from '../deals/crm-deal-card';

// ----------------------------------------------------------------------

export function CrmFunnelView() {
  return (
    <DashboardContent maxWidth={false} sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <CustomBreadcrumbs heading="Funil de captação" links={[{ name: 'CRM', href: paths.dashboard.crm.root }, { name: 'Funil' }]} sx={{ mb: 3 }} />
      <CrmAccessGuard min="agente">
        <Board />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

type PendingMove = { deal: CrmDeal; stage: CrmPipelineStage };

function Board() {
  const router = useRouter();
  const { me, can } = useCrmAccess();
  const canSupervise = can('supervisor');
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [pipelineId, setPipelineId] = useState<string>('');
  const [pipeline, setPipeline] = useState<CrmPipeline | null>(null);
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [owner, setOwner] = useState('');
  const [source, setSource] = useState('');
  const [creating, setCreating] = useState<{ stageId: string | null } | null>(null);
  const [lostMove, setLostMove] = useState<PendingMove | null>(null);
  const [wonMove, setWonMove] = useState<PendingMove | null>(null);
  const [activeDeal, setActiveDeal] = useState<CrmDeal | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }));

  const load = useCallback(() => {
    setLoading(true);
    CrmService.getBoard({ pipelineId: pipelineId || undefined, owner: owner || undefined, source: source || undefined, search: search.trim() || undefined })
      .then((board) => {
        setPipelines(board.pipelines);
        setPipeline(board.pipeline);
        setDeals(board.deals);
        if (board.truncated) toast.warning('Há muitos leads abertos; use os filtros para ver todos.');
      })
      .catch((err) => toast.error(err?.message || 'Erro ao carregar o funil'))
      .finally(() => setLoading(false));
  }, [pipelineId, owner, source, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  // Tempo real: outro usuário mexeu num lead deste funil.
  useCrmSocketEvent<CrmDealSocketPayload>('crm:deal:updated', ({ deal }) => {
    if (!pipeline || deal.pipelineId !== pipeline.id) return;
    if (isDeletedDeal(deal)) {
      setDeals((list) => list.filter((d) => d.id !== deal.id));
      return;
    }
    const visible = canSupervise || pipeline.agentsSeeAll || deal.owner?.id === me?.user.id;
    const filteredOut = (owner === 'me' && deal.owner?.id !== me?.user.id) || (owner === 'none' && !!deal.owner) || (!!source && deal.source !== source);
    setDeals((list) => (visible && !filteredOut ? upsertDeal(list, deal) : list.filter((d) => d.id !== deal.id)));
  });

  const stages = useMemo(() => (pipeline?.stages ?? []).filter((s) => s.active), [pipeline]);

  const moveDeal = async (deal: CrmDeal, stage: CrmPipelineStage, lostReason?: string) => {
    const previous = deal;
    setDeals((list) => upsertDeal(list, { ...deal, stageId: stage.id, stage: { name: stage.name, color: stage.color, kind: stage.kind, probability: stage.probability } }));
    try {
      const updated = await CrmService.moveDeal(deal.id, stage.id, lostReason);
      setDeals((list) => upsertDeal(list, updated));
    } catch (err: any) {
      setDeals((list) => upsertDeal(list, previous));
      toast.error(err?.message || 'Não foi possível mover o lead.');
    }
  };

  const onDragStart = (event: DragStartEvent) => setActiveDeal((event.active.data.current?.deal as CrmDeal) ?? null);

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    const deal = event.active.data.current?.deal as CrmDeal | undefined;
    const stage = stages.find((s) => s.id === event.over?.id);
    if (!deal || !stage || stage.id === deal.stageId) return;
    if (stage.kind === 'lost') setLostMove({ deal, stage });
    else if (stage.kind === 'won' && !deal.convertedStudentId) setWonMove({ deal, stage });
    else moveDeal(deal, stage);
  };

  const openDeal = (deal: CrmDeal) => router.push(paths.dashboard.crm.lead(deal.id));

  if (loading && !pipeline) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 8 }} />;

  return (
    <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
        {pipelines.length > 1 && (
          <TextField select size="small" label="Funil" value={pipeline?.id ?? ''} onChange={(e) => setPipelineId(e.target.value)} sx={{ minWidth: 180 }}>
            {pipelines.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          size="small"
          placeholder="Buscar aluno, responsável, telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" />
              </InputAdornment>
            ),
          }}
        />
        {(canSupervise || pipeline?.agentsSeeAll) && (
          <TextField select size="small" label="Responsável" value={owner} onChange={(e) => setOwner(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="me">Meus leads</MenuItem>
            <MenuItem value="none">Sem responsável</MenuItem>
          </TextField>
        )}
        <TextField select size="small" label="Origem" value={source} onChange={(e) => setSource(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">Todas</MenuItem>
          {CRM_DEAL_SOURCES.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <IconButton onClick={load} aria-label="Atualizar">
          <Iconify icon="solar:refresh-bold" />
        </IconButton>
        <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={() => setCreating({ stageId: null })}>
          Novo lead
        </Button>
      </Stack>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveDeal(null)}>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, flex: 1, minHeight: 420, alignItems: 'flex-start' }}>
          {stages.map((stage) => (
            <Column
              key={stage.id}
              stage={stage}
              deals={deals.filter((d) => d.stageId === stage.id)}
              onOpen={openDeal}
              onCreate={stage.kind === 'open' ? () => setCreating({ stageId: stage.id }) : undefined}
            />
          ))}
        </Box>
        <DragOverlay>{activeDeal ? <CrmDealCardContent deal={activeDeal} dragging /> : null}</DragOverlay>
      </DndContext>

      <CrmDealFormDialog
        open={!!creating}
        onClose={() => setCreating(null)}
        onSaved={(deal) => setDeals((list) => upsertDeal(list, deal))}
        pipeline={pipeline}
        stageId={creating?.stageId}
        canSupervise={canSupervise}
      />
      <CrmDealLostDialog
        open={!!lostMove}
        onClose={() => setLostMove(null)}
        onConfirm={async (reason) => {
          if (lostMove) await moveDeal(lostMove.deal, lostMove.stage, reason);
          setLostMove(null);
        }}
      />
      {wonMove && (
        <CrmDealConvertDialog
          open
          deal={wonMove.deal}
          onClose={() => setWonMove(null)}
          onConverted={(deal) => setDeals((list) => upsertDeal(list, deal))}
          onWonWithoutStudent={async () => {
            await moveDeal(wonMove.deal, wonMove.stage);
            setWonMove(null);
          }}
        />
      )}
    </Stack>
  );
}

type ColumnProps = {
  stage: CrmPipelineStage;
  deals: CrmDeal[];
  onOpen: (deal: CrmDeal) => void;
  onCreate?: () => void;
};

function Column({ stage, deals, onOpen, onCreate }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = deals.reduce((sum, d) => sum + (d.estimatedValue ?? 0), 0);
  const weighted = deals.reduce((sum, d) => sum + (d.weightedValue ?? 0), 0);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        width: 290,
        flexShrink: 0,
        borderRadius: 2,
        bgcolor: isOver ? 'action.selected' : 'background.neutral',
        transition: 'background-color 120ms',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
      }}
    >
      <Box sx={{ p: 1.5, borderTop: 4, borderColor: stage.color, borderRadius: '8px 8px 0 0' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ flex: 1 }} noWrap title={stage.name}>
            {stage.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {deals.length}
          </Typography>
          {onCreate && (
            <IconButton size="small" onClick={onCreate} aria-label={`Novo lead em ${stage.name}`}>
              <Iconify icon="mingcute:add-line" width={16} />
            </IconButton>
          )}
        </Stack>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {fCurrency(total) || 'R$ 0'}
          {stage.kind === 'open' ? ` · ponderado ${fCurrency(weighted) || 'R$ 0'} (${stage.probability}%)` : stage.kind === 'won' ? ' · últimos 30 dias' : ' · últimos 30 dias'}
        </Typography>
      </Box>
      <Stack spacing={1} sx={{ p: 1, pt: 0, overflowY: 'auto', minHeight: 80 }}>
        {deals.map((deal) => (
          <CrmDealCard key={deal.id} deal={deal} onOpen={onOpen} />
        ))}
        {!deals.length && (
          <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center', py: 2 }}>
            Arraste leads para cá
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

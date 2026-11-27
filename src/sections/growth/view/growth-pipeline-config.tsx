'use client';

import type { CrmPipeline, CrmStageKind, CrmStageInput } from 'src/types/services/crm-deal';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { GrowthService } from 'src/services/growth';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { CRM_STAGE_KIND_LABELS } from 'src/types/services/crm-deal';


// ----------------------------------------------------------------------

const COLORS = ['#00B8D9', '#8E33FF', '#FFAB00', '#078DEE', '#22C55E', '#FF5630', '#637381', '#00A76F'];

/** Configuração dos funis e etapas (só gestor; o guard fica na tela de configurações). */
export function GrowthPipelineConfig() {
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('');
  const [agentsSeeAll, setAgentsSeeAll] = useState(false);
  const [stalledDays, setStalledDays] = useState(7);
  const [stages, setStages] = useState<CrmStageInput[]>([]);
  const [saving, setSaving] = useState(false);

  const apply = (p: CrmPipeline | undefined) => {
    if (!p) return;
    setSelectedId(p.id);
    setName(p.name);
    setAgentsSeeAll(p.agentsSeeAll);
    setStalledDays(p.stalledDays ?? 7);
    setStages(p.stages.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name, color: s.color, probability: s.probability, kind: s.kind })));
  };

  const load = useCallback((keepId?: string) => {
    GrowthService.listPipelines()
      .then((list) => {
        setPipelines(list);
        apply(list.find((p) => p.id === keepId) ?? list.find((p) => p.isDefault) ?? list[0]);
      })
      .catch((err) => toast.error(err?.message || 'Erro ao carregar funis'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (index: number, patch: Partial<CrmStageInput>) => setStages((list) => list.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const moveStage = (index: number, delta: number) =>
    setStages((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const save = async () => {
    setSaving(true);
    try {
      await GrowthService.updatePipeline(selectedId, { name: name.trim(), agentsSeeAll, stalledDays, stages: stages.map((s) => ({ ...s, name: s.name.trim() })) });
      toast.success('Funil salvo.');
      load(selectedId);
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível salvar o funil.');
    } finally {
      setSaving(false);
    }
  };

  const createPipeline = async () => {
    try {
      const created = await GrowthService.createPipeline({ name: 'Novo funil' });
      load(created.id);
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível criar o funil.');
    }
  };

  if (!selectedId) return null;

  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          {pipelines.length > 1 && (
            <TextField select size="small" label="Funil" value={selectedId} onChange={(e) => apply(pipelines.find((p) => p.id === e.target.value))} sx={{ minWidth: 200 }}>
              {pipelines.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                  {p.isDefault ? ' (padrão)' : ''}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField size="small" label="Nome do funil" value={name} onChange={(e) => setName(e.target.value)} inputProps={{ maxLength: 80 }} />
          <TextField
            size="small"
            type="number"
            label="Lead parado após (dias)"
            value={stalledDays}
            onChange={(e) => setStalledDays(Math.max(1, Math.min(365, Math.round(Number(e.target.value) || 1))))}
            helperText="Usado na Recuperação"
            sx={{ width: 190 }}
          />
          <FormControlLabel
            control={<Switch checked={agentsSeeAll} onChange={(e) => setAgentsSeeAll(e.target.checked)} />}
            label="Agentes veem todos os leads deste funil"
          />
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" onClick={createPipeline} startIcon={<Iconify icon="mingcute:add-line" />}>
            Novo funil
          </Button>
        </Stack>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
          Desligado: cada agente vê só os leads em que é o responsável. Supervisores e gestores sempre veem todos.
        </Typography>
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Etapas
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          O funil precisa de ao menos uma etapa em andamento, exatamente uma de ganho (ex.: Matriculado) e uma de perda (ex.: Perdido). Etapas com leads não
          podem ser removidas nem mudar de tipo.
        </Alert>
        <Stack spacing={1.5}>
          {stages.map((s, i) => (
            <Stack key={s.id ?? `new-${i}`} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <Stack direction="row">
                <IconButton size="small" onClick={() => moveStage(i, -1)} disabled={i === 0} aria-label="Subir etapa">
                  <Iconify icon="eva:arrow-ios-upward-fill" />
                </IconButton>
                <IconButton size="small" onClick={() => moveStage(i, 1)} disabled={i === stages.length - 1} aria-label="Descer etapa">
                  <Iconify icon="eva:arrow-ios-downward-fill" />
                </IconButton>
              </Stack>
              <TextField size="small" label="Nome" value={s.name} onChange={(e) => update(i, { name: e.target.value })} inputProps={{ maxLength: 60 }} sx={{ flex: 1 }} />
              <TextField select size="small" label="Tipo" value={s.kind} onChange={(e) => update(i, { kind: e.target.value as CrmStageKind })} sx={{ width: 150 }}>
                {(Object.keys(CRM_STAGE_KIND_LABELS) as CrmStageKind[]).map((k) => (
                  <MenuItem key={k} value={k}>
                    {CRM_STAGE_KIND_LABELS[k]}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                type="number"
                label="Probabilidade %"
                value={s.probability ?? 0}
                onChange={(e) => update(i, { probability: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                sx={{ width: 140 }}
              />
              <Stack direction="row" spacing={0.5}>
                {COLORS.map((c) => (
                  <Box
                    key={c}
                    role="button"
                    aria-label={`Cor ${c}`}
                    onClick={() => update(i, { color: c })}
                    sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: c, cursor: 'pointer', outline: s.color === c ? '2px solid' : 'none', outlineOffset: 2 }}
                  />
                ))}
              </Stack>
              <IconButton color="error" onClick={() => setStages((list) => list.filter((_, idx) => idx !== i))} aria-label="Remover etapa">
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Stack>
          ))}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
          <Button
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => {
              const firstClosed = stages.findIndex((s) => s.kind !== 'open');
              const at = firstClosed === -1 ? stages.length : firstClosed;
              setStages((list) => [...list.slice(0, at), { name: '', kind: 'open', probability: 50, color: COLORS[0] }, ...list.slice(at)]);
            }}
          >
            Adicionar etapa
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button color="inherit" onClick={() => load(selectedId)}>
            Descartar
          </Button>
          <LoadingButton variant="contained" loading={saving} onClick={save}>
            Salvar funil
          </LoadingButton>
        </Stack>
      </Card>
    </Stack>
  );
}

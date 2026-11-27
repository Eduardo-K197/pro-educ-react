'use client';

import type {
  AiPurpose,
  AiModelRow,
  AiProviderInfo,
  AiProviderName,
  AiProvidersState,
  AiModelChainItem,
} from 'src/types/services/ai-providers';

import { useMemo, useState, useEffect } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Autocomplete from '@mui/material/Autocomplete';

import { AiProviderService } from 'src/services/ai-providers';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import {
  AI_PURPOSE_LABELS,
  AI_PURPOSE_DESCRIPTIONS,
  AI_PROVIDER_FALLBACK_LABELS,
} from 'src/types/services/ai-providers';

// ----------------------------------------------------------------------

type DraftRow = {
  key: string;
  provider: AiProviderName;
  model: string;
  enabled: boolean;
  /** Preservado do servidor; não é editado nesta tela. */
  options: Record<string, unknown> | null;
};

type Props = {
  purpose: AiPurpose;
  rows: AiModelRow[];
  providers: AiProviderInfo[];
  onSaved: (state: AiProvidersState) => void;
};

let keySeq = 0;
const newKey = () => {
  keySeq += 1;
  return `new-${keySeq}`;
};

const toDraft = (rows: AiModelRow[]): DraftRow[] =>
  [...rows]
    .sort((a, b) => a.priority - b.priority)
    .map((r) => ({
      key: r.id,
      provider: r.provider,
      model: r.model,
      enabled: r.enabled,
      options: r.options ?? null,
    }));

const toChain = (draft: DraftRow[]): AiModelChainItem[] =>
  draft.map((r) => ({
    provider: r.provider,
    model: r.model.trim(),
    enabled: r.enabled,
    options: r.options,
  }));

/** Cadeia de modelos de uma finalidade: o 1º é o principal, os demais são fallback, nesta ordem. */
export function AiModelChainCard({ purpose, rows, providers, onSaved }: Props) {
  const [draft, setDraft] = useState<DraftRow[]>(() => toDraft(rows));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(toDraft(rows));
  }, [rows]);

  const providerMap = useMemo(
    () => new Map(providers.map((p) => [p.provider, p] as const)),
    [providers]
  );

  const providerOptions: AiProviderName[] = useMemo(() => {
    const list = providers.map((p) => p.provider);
    return list.length ? list : (Object.keys(AI_PROVIDER_FALLBACK_LABELS) as AiProviderName[]);
  }, [providers]);

  const providerLabel = (name: AiProviderName) =>
    providerMap.get(name)?.label ?? AI_PROVIDER_FALLBACK_LABELS[name] ?? name;

  const dirty = useMemo(
    () => JSON.stringify(toChain(draft)) !== JSON.stringify(toChain(toDraft(rows))),
    [draft, rows]
  );

  const invalid = !draft.length || draft.some((r) => !r.model.trim());
  const noneEnabled = draft.length > 0 && draft.every((r) => !r.enabled);

  const update = (index: number, patch: Partial<DraftRow>) =>
    setDraft((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const changeProvider = (index: number, provider: AiProviderName) => {
    const models = providerMap.get(provider)?.models ?? [];
    setDraft((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const model = models.includes(r.model) ? r.model : (models[0] ?? '');
        return { ...r, provider, model };
      })
    );
  };

  const move = (index: number, dir: -1 | 1) =>
    setDraft((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const remove = (index: number) => setDraft((prev) => prev.filter((_, i) => i !== index));

  const add = () => {
    const provider = providerOptions[0];
    const models = providerMap.get(provider)?.models ?? [];
    setDraft((prev) => [
      ...prev,
      { key: newKey(), provider, model: models[0] ?? '', enabled: true, options: null },
    ]);
  };

  const save = async () => {
    setSaving(true);
    try {
      const state = await AiProviderService.saveModelConfig(purpose, { chain: toChain(draft) });
      onSaved(state);
      toast.success(`${AI_PURPOSE_LABELS[purpose]}: modelos salvos`);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar os modelos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h6">{AI_PURPOSE_LABELS[purpose]}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {AI_PURPOSE_DESCRIPTIONS[purpose]} O 1º modelo é o principal; os seguintes são
            tentados em ordem quando o anterior falha.
          </Typography>
        </Stack>

        {!draft.length && (
          <Alert severity="warning">Nenhum modelo na cadeia. Adicione ao menos um para salvar.</Alert>
        )}

        {draft.map((row, index) => {
          const info = providerMap.get(row.provider);
          const models = info?.models ?? [];
          return (
            <Stack
              key={row.key}
              spacing={1}
              sx={{
                p: 1.5,
                borderRadius: 1,
                border: (theme) => `1px dashed ${theme.vars.palette.divider}`,
                opacity: row.enabled ? 1 : 0.6,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Label color={index === 0 ? 'primary' : 'default'}>
                  {index === 0 ? '1º · principal' : `${index + 1}º · fallback`}
                </Label>
                {info && !info.configured && (
                  <Label color="warning">Provedor sem chave</Label>
                )}
                <Stack direction="row" sx={{ ml: 'auto' }}>
                  <Tooltip title="Subir">
                    <span>
                      <IconButton size="small" disabled={index === 0} onClick={() => move(index, -1)}>
                        <Iconify icon="eva:arrow-ios-upward-fill" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Descer">
                    <span>
                      <IconButton
                        size="small"
                        disabled={index === draft.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <Iconify icon="eva:arrow-ios-downward-fill" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={draft.length <= 1 ? 'A cadeia precisa de ao menos 1 modelo' : 'Remover'}>
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={draft.length <= 1}
                        onClick={() => remove(index)}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
                <TextField
                  select
                  size="small"
                  label="Provedor"
                  value={row.provider}
                  onChange={(e) => changeProvider(index, e.target.value as AiProviderName)}
                  sx={{ minWidth: 160 }}
                >
                  {providerOptions.map((p) => (
                    <MenuItem key={p} value={p}>
                      {providerLabel(p)}
                    </MenuItem>
                  ))}
                </TextField>

                <Autocomplete<string, false, false, true>
                  freeSolo
                  size="small"
                  options={models}
                  value={row.model}
                  inputValue={row.model}
                  onChange={(_, value) => update(index, { model: value ?? '' })}
                  onInputChange={(_, value) => update(index, { model: value })}
                  sx={{ flex: 1, minWidth: 220 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Modelo"
                      error={!row.model.trim()}
                      helperText={!row.model.trim() ? 'Informe o modelo' : undefined}
                    />
                  )}
                />

                <Stack direction="row" alignItems="center">
                  <Switch
                    checked={row.enabled}
                    onChange={(e) => update(index, { enabled: e.target.checked })}
                  />
                  <Typography variant="body2">{row.enabled ? 'Ligado' : 'Desligado'}</Typography>
                </Stack>
              </Stack>
            </Stack>
          );
        })}

        {noneEnabled && (
          <Alert severity="warning">Todos os modelos estão desligados: esta finalidade fica sem IA.</Alert>
        )}

        <Stack direction="row" spacing={1} justifyContent="space-between">
          <Button
            size="small"
            color="inherit"
            onClick={add}
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Adicionar modelo
          </Button>
          <Stack direction="row" spacing={1}>
            {dirty && (
              <Button size="small" color="inherit" disabled={saving} onClick={() => setDraft(toDraft(rows))}>
                Descartar
              </Button>
            )}
            <LoadingButton
              size="small"
              variant="contained"
              loading={saving}
              disabled={!dirty || invalid}
              onClick={save}
            >
              Salvar
            </LoadingButton>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}

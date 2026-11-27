'use client';

import type { CrmDepartment } from 'src/types/services/crm';
import type {
  CrmTicketConfig,
  CrmTicketPriority,
  CrmTicketSlaMatrix,
} from 'src/types/services/crm-ticket';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { CrmService } from 'src/services/crm';
import { CrmTicketService } from 'src/services/crm-ticket';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { CRM_TICKET_PRIORITIES, CRM_TICKET_PRIORITY_LABELS } from 'src/types/services/crm-ticket';

import { slugifyKey } from '../crm/tickets/utils';

// ----------------------------------------------------------------------

type Hours = Record<CrmTicketPriority, string>;

type CategoryRow = {
  /** Identificador local (estável enquanto edita). */
  uid: string;
  /** Chave salva; vazia para categoria nova (gerada a partir do rótulo). */
  key: string;
  label: string;
  departmentId: string;
  /** Vazio = usa o padrão. */
  overrides: Hours;
};

type FormState = {
  categories: CategoryRow[];
  defaults: Hours;
  warnBeforeMinutes: string;
};

const EMPTY_HOURS: Hours = { baixa: '', media: '', alta: '', urgente: '' };

let uidSeq = 0;
const nextUid = () => {
  uidSeq += 1;
  return `cat-${uidSeq}`;
};

const toHours = (m: Partial<CrmTicketSlaMatrix> | undefined): Hours => ({
  baixa: m?.baixa != null ? String(m.baixa) : '',
  media: m?.media != null ? String(m.media) : '',
  alta: m?.alta != null ? String(m.alta) : '',
  urgente: m?.urgente != null ? String(m.urgente) : '',
});

const toForm = (c: CrmTicketConfig): FormState => ({
  categories: c.categories.map((cat) => ({
    uid: nextUid(),
    key: cat.key,
    label: cat.label,
    departmentId: cat.departmentId ?? '',
    overrides: toHours(c.slaHours.byCategory?.[cat.key]),
  })),
  defaults: toHours(c.slaHours.default),
  warnBeforeMinutes: String(c.warnBeforeMinutes ?? 0),
});

const parseHours = (value: string) => Number(value.replace(',', '.'));
const isValidHours = (value: string) =>
  /^\d+([.,]\d+)?$/.test(value.trim()) && parseHours(value) > 0;

/** Chaves finais: existentes ficam; novas vêm do rótulo, sem repetir. */
function resolveKeys(categories: CategoryRow[]) {
  const used = new Set(categories.filter((c) => c.key).map((c) => c.key));
  return categories.map((c) => {
    if (c.key) return c.key;
    const base = slugifyKey(c.label) || 'categoria';
    let key = base;
    let n = 2;
    while (used.has(key)) {
      key = `${base}_${n}`;
      n += 1;
    }
    used.add(key);
    return key;
  });
}

// ----------------------------------------------------------------------

export function TicketSlaConfig() {
  const [config, setConfig] = useState<CrmTicketConfig | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [departments, setDepartments] = useState<CrmDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      CrmTicketService.getConfig(),
      CrmService.listDepartments().catch(() => [] as CrmDepartment[]),
    ])
      .then(([c, depts]) => {
        setConfig(c);
        setForm(toForm(c));
        setDepartments(depts);
      })
      .catch((err) => setError(err?.message || 'Erro ao carregar a configuração de chamados'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !config) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 8 }} />;
  }

  if (error || !config || !form) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={load}>
            Tentar novamente
          </Button>
        }
      >
        {error || 'Configuração indisponível'}
      </Alert>
    );
  }

  const priorities = config.priorities.length
    ? config.priorities.map((p) => p.key)
    : CRM_TICKET_PRIORITIES;
  const priorityLabel = (p: CrmTicketPriority) =>
    config.priorities.find((x) => x.key === p)?.label ?? CRM_TICKET_PRIORITY_LABELS[p] ?? p;

  const setCategory = (uid: string, patch: Partial<CategoryRow>) =>
    setForm((f) =>
      f
        ? { ...f, categories: f.categories.map((c) => (c.uid === uid ? { ...c, ...patch } : c)) }
        : f
    );

  const addCategory = () =>
    setForm((f) =>
      f
        ? {
            ...f,
            categories: [
              ...f.categories,
              {
                uid: nextUid(),
                key: '',
                label: '',
                departmentId: '',
                overrides: { ...EMPTY_HOURS },
              },
            ],
          }
        : f
    );

  const removeCategory = (uid: string) =>
    setForm((f) => (f ? { ...f, categories: f.categories.filter((c) => c.uid !== uid) } : f));

  const keys = resolveKeys(form.categories);
  const labelErrors = form.categories.map((c) => !c.label.trim());
  const defaultErrors = priorities.map((p) => !isValidHours(form.defaults[p]));
  const overrideError = (v: string) => v.trim() !== '' && !isValidHours(v);
  const warnInvalid = !/^\d+$/.test(form.warnBeforeMinutes.trim());
  const invalid =
    labelErrors.some(Boolean) ||
    defaultErrors.some(Boolean) ||
    form.categories.some((c) => priorities.some((p) => overrideError(c.overrides[p]))) ||
    warnInvalid ||
    !form.categories.length;

  const save = async () => {
    if (invalid) return;
    setSaving(true);
    try {
      const defaults = Object.fromEntries(
        priorities.map((p) => [p, parseHours(form.defaults[p])])
      ) as CrmTicketSlaMatrix;
      const byCategory: Record<string, Partial<CrmTicketSlaMatrix>> = {};
      form.categories.forEach((c, i) => {
        const override: Partial<CrmTicketSlaMatrix> = {};
        priorities.forEach((p) => {
          if (c.overrides[p].trim()) override[p] = parseHours(c.overrides[p]);
        });
        if (Object.keys(override).length) byCategory[keys[i]] = override;
      });
      const updated = await CrmTicketService.updateConfig({
        categories: form.categories.map((c, i) => ({
          key: keys[i],
          label: c.label.trim(),
          departmentId: c.departmentId || null,
        })),
        slaHours: { default: defaults, byCategory },
        warnBeforeMinutes: Number(form.warnBeforeMinutes),
      });
      setConfig(updated);
      setForm(toForm(updated));
      toast.success('Configuração de chamados salva');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar a configuração de chamados');
    } finally {
      setSaving(false);
    }
  };

  const deptOptions = (current: string) => departments.filter((d) => d.active || d.id === current);

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Alert severity="info">
          O prazo do SLA conta em <strong>horário útil do setor</strong> do chamado (o horário de
          atendimento configurado em{' '}
          <Button
            component={RouterLink}
            href={paths.dashboard.crm.departments}
            size="small"
            sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline' }}
          >
            CRM › Setores
          </Button>
          ). Setor sem horário configurado, ou chamado sem setor, conta 24 horas por dia.
        </Alert>

        {/* Categorias ------------------------------------------------------ */}
        <Stack spacing={1.5}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">Categorias</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Cada chamado tem uma categoria. O setor padrão é sugerido ao abrir o chamado
              (inclusive pela IA).
            </Typography>
          </Stack>

          {form.categories.map((c, i) => (
            <Stack
              key={c.uid}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ sm: 'flex-start' }}
            >
              <TextField
                size="small"
                label="Nome"
                value={c.label}
                onChange={(e) => setCategory(c.uid, { label: e.target.value })}
                error={labelErrors[i]}
                helperText={labelErrors[i] ? 'Informe o nome.' : `Chave: ${keys[i]}`}
                inputProps={{ maxLength: 60 }}
                sx={{ flex: 1 }}
              />
              <TextField
                select
                size="small"
                label="Setor padrão"
                value={c.departmentId}
                onChange={(e) => setCategory(c.uid, { departmentId: e.target.value })}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
                helperText=" "
                sx={{ flex: 1 }}
              >
                <MenuItem value="">(sem setor padrão)</MenuItem>
                {deptOptions(c.departmentId).map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                    {!d.active ? ' (inativo)' : ''}
                  </MenuItem>
                ))}
              </TextField>
              <IconButton
                color="error"
                onClick={() => removeCategory(c.uid)}
                sx={{ mt: { sm: 0.5 } }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
              </IconButton>
            </Stack>
          ))}

          {!form.categories.length && (
            <Typography variant="body2" sx={{ color: 'error.main' }}>
              Cadastre ao menos uma categoria.
            </Typography>
          )}

          <Button
            size="small"
            color="inherit"
            variant="outlined"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={addCategory}
            sx={{ alignSelf: 'flex-start' }}
          >
            Adicionar categoria
          </Button>
        </Stack>

        <Divider />

        {/* Matriz de SLA -------------------------------------------------- */}
        <Stack spacing={1.5}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">Prazo do SLA (horas úteis)</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              A linha &quot;Padrão&quot; vale para todas as categorias. Preencha uma célula de
              categoria só para sobrescrever o padrão; em branco, usa o padrão.
            </Typography>
          </Stack>

          <Scrollbar>
            <TableContainer sx={{ minWidth: 640 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Categoria</TableCell>
                    {priorities.map((p) => (
                      <TableCell key={p} align="center" sx={{ width: 120 }}>
                        {priorityLabel(p)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Typography variant="subtitle2">Padrão</Typography>
                    </TableCell>
                    {priorities.map((p, i) => (
                      <TableCell key={p} align="center">
                        <HoursInput
                          value={form.defaults[p]}
                          error={defaultErrors[i]}
                          onChange={(v) =>
                            setForm((f) => (f ? { ...f, defaults: { ...f.defaults, [p]: v } } : f))
                          }
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                  {form.categories.map((c) => (
                    <TableRow key={c.uid}>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {c.label || '(sem nome)'}
                        </Typography>
                      </TableCell>
                      {priorities.map((p) => (
                        <TableCell key={p} align="center">
                          <HoursInput
                            value={c.overrides[p]}
                            placeholder={form.defaults[p]}
                            error={overrideError(c.overrides[p])}
                            onChange={(v) =>
                              setCategory(c.uid, { overrides: { ...c.overrides, [p]: v } })
                            }
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>
        </Stack>

        <Divider />

        <TextField
          label="Avisar antes de estourar"
          value={form.warnBeforeMinutes}
          onChange={(e) =>
            setForm((f) => (f ? { ...f, warnBeforeMinutes: e.target.value.replace(/\D/g, '') } : f))
          }
          error={warnInvalid}
          helperText={
            warnInvalid
              ? 'Informe um número inteiro de minutos.'
              : 'A equipe recebe o alerta "SLA perto de estourar" este tempo antes do prazo.'
          }
          inputProps={{ inputMode: 'numeric' }}
          InputProps={{ endAdornment: <InputAdornment position="end">minutos</InputAdornment> }}
          sx={{ maxWidth: 320 }}
        />

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button
            variant="outlined"
            color="inherit"
            disabled={saving}
            onClick={() => setForm(toForm(config))}
          >
            Descartar
          </Button>
          <LoadingButton variant="contained" loading={saving} disabled={invalid} onClick={save}>
            Salvar
          </LoadingButton>
        </Stack>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

type HoursInputProps = {
  value: string;
  placeholder?: string;
  error?: boolean;
  onChange: (value: string) => void;
};

function HoursInput({ value, placeholder, error, onChange }: HoursInputProps) {
  return (
    <TextField
      size="small"
      value={value}
      placeholder={placeholder}
      error={error}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
      inputProps={{ inputMode: 'decimal', style: { textAlign: 'center' } }}
      InputProps={{ endAdornment: <InputAdornment position="end">h</InputAdornment> }}
      sx={{ width: 100 }}
    />
  );
}

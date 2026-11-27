'use client';

import type { CrmDepartment } from 'src/types/services/crm';
import type { CrmAiMode, CrmAiTool, CrmAiUsage, CrmAiDecision, CrmAiSettings } from 'src/types/services/crm-ai';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import LoadingButton from '@mui/lab/LoadingButton';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate, fDateTime } from 'src/utils/format-time';

import { CrmService } from 'src/services/crm';
import { CrmAiService } from 'src/services/crm-ai';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import {
  CRM_AI_MODE_LABELS,
  CRM_AI_DECISION_LABELS,
  CRM_AI_DECISION_COLORS,
  CRM_AI_MODE_DESCRIPTIONS,
} from 'src/types/services/crm-ai';

import { fInt, fUsd } from '../utils';
import { CrmAccessGuard } from '../../crm/crm-access-guard';

// ----------------------------------------------------------------------

const MODES: CrmAiMode[] = ['shadow', 'suggest', 'execute'];
const DECISIONS: CrmAiDecision[] = ['reply', 'handoff', 'skip', 'error'];

type FormState = {
  enabled: boolean;
  mode: CrmAiMode;
  persona: string;
  instructions: string;
  handoffDepartmentId: string;
  monthlyTokenBudget: string;
  enabledTools: string[];
};

const toForm = (s: CrmAiSettings): FormState => ({
  enabled: s.enabled,
  mode: s.mode,
  persona: s.persona ?? '',
  instructions: s.instructions ?? '',
  handoffDepartmentId: s.handoffDepartmentId ?? '',
  monthlyTokenBudget: String(s.monthlyTokenBudget ?? 0),
  enabledTools: s.tools ? s.tools.filter((t) => t.enabled).map((t) => t.name) : [...(s.enabledTools ?? [])],
});

export function IntelligenceSettingsView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Autoatendimento"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Intelligence', href: paths.dashboard.intelligence.root },
          { name: 'Autoatendimento' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <CrmAccessGuard min="gestor">
        <SettingsForm />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

function SettingsForm() {
  const [settings, setSettings] = useState<CrmAiSettings | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [departments, setDepartments] = useState<CrmDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([CrmAiService.getSettings(), CrmService.listDepartments().catch(() => [] as CrmDepartment[])])
      .then(([s, depts]) => {
        setSettings(s);
        setForm(toForm(s));
        setDepartments(depts);
      })
      .catch((err) => setError(err?.message || 'Erro ao carregar a configuração da IA'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (patch: Partial<FormState>) => setForm((f) => (f ? { ...f, ...patch } : f));

  const budget = Number(form?.monthlyTokenBudget);
  const budgetInvalid = !!form && (!/^\d+$/.test(form.monthlyTokenBudget.trim()) || !Number.isFinite(budget));

  const save = async () => {
    if (!form || budgetInvalid) return;
    setSaving(true);
    try {
      const updated = await CrmAiService.updateSettings({
        enabled: form.enabled,
        mode: form.mode,
        persona: form.persona.trim() || null,
        instructions: form.instructions.trim() || null,
        handoffDepartmentId: form.handoffDepartmentId || null,
        monthlyTokenBudget: budget,
        enabledTools: form.enabledTools,
      });
      setSettings(updated);
      setForm(toForm(updated));
      toast.success('Configuração da IA salva');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar a configuração da IA');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 8 }} />;
  }

  if (error || !settings || !form) {
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

  // Setor salvo pode ter sido desativado: mantém na lista para não sumir do select.
  const deptOptions = departments.filter((d) => d.active || d.id === form.handoffDepartmentId);

  return (
    <Grid container spacing={3}>
      <Grid xs={12} md={7}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {!settings.providerConfigured && (
              <Alert severity="warning">
                Chave da IA não configurada no servidor. Você pode salvar a configuração, mas a IA não vai atender até o
                suporte do ProEduc configurar a chave.
              </Alert>
            )}

            <FormControlLabel
              control={<Switch checked={form.enabled} onChange={(e) => set({ enabled: e.target.checked })} />}
              label={
                <Stack>
                  <Typography variant="subtitle2">Autoatendimento com IA ligado</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Também é preciso ativar &quot;Autoatendimento com IA&quot; em cada canal (CRM › Canais).
                  </Typography>
                </Stack>
              }
            />

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2">Como a IA deve agir</Typography>
              <RadioGroup value={form.mode} onChange={(e) => set({ mode: e.target.value as CrmAiMode })}>
                {MODES.map((m) => (
                  <FormControlLabel
                    key={m}
                    value={m}
                    control={<Radio />}
                    sx={{ alignItems: 'flex-start', mb: 1, '& .MuiRadio-root': { mt: -0.75 } }}
                    label={
                      <Stack>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {CRM_AI_MODE_LABELS[m]}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {CRM_AI_MODE_DESCRIPTIONS[m]}
                        </Typography>
                      </Stack>
                    }
                  />
                ))}
              </RadioGroup>
            </Stack>

            <Divider />

            <TextField
              label="Persona"
              placeholder="Ex.: Você é a Ana, assistente virtual da secretaria da Escola Exemplo. Seja cordial e objetiva."
              helperText="Quem a IA é e o tom de voz com que fala com as famílias."
              value={form.persona}
              onChange={(e) => set({ persona: e.target.value })}
              multiline
              minRows={2}
            />
            <TextField
              label="Instruções"
              placeholder="Ex.: Não informe valores de mensalidade; para matrícula, encaminhe ao setor Comercial."
              helperText="Regras da escola: o que pode ou não responder e quando passar para um atendente."
              value={form.instructions}
              onChange={(e) => set({ instructions: e.target.value })}
              multiline
              minRows={4}
            />
            <TextField
              select
              label="Setor para encaminhar (handoff)"
              helperText={
                form.handoffDepartmentId
                  ? 'Quando a IA passa a conversa para uma pessoa, ela entra na fila deste setor.'
                  : 'Quando a IA passa a conversa para uma pessoa, ela continua no setor em que já está (ou sem setor).'
              }
              value={form.handoffDepartmentId}
              onChange={(e) => set({ handoffDepartmentId: e.target.value })}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">Manter o setor atual da conversa</MenuItem>
              {deptOptions.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                  {!d.active ? ' (inativo)' : ''}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Teto mensal de tokens"
              value={form.monthlyTokenBudget}
              onChange={(e) => set({ monthlyTokenBudget: e.target.value.replace(/\D/g, '') })}
              error={budgetInvalid}
              helperText={
                budgetInvalid
                  ? 'Informe um número inteiro (0 = sem teto).'
                  : 'Ao atingir o teto no mês, a IA para de atender e as conversas seguem para a equipe. 0 = sem teto.'
              }
              inputProps={{ inputMode: 'numeric' }}
              InputProps={{ endAdornment: <InputAdornment position="end">tokens</InputAdornment> }}
            />

            <Divider />

            <ToolsSection
              tools={settings.tools ?? []}
              enabled={form.enabledTools}
              onChange={(enabledTools) => set({ enabledTools })}
            />

            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {settings.updatedAt ? `Atualizado em ${fDateTime(settings.updatedAt, 'DD/MM/YYYY HH:mm')}` : 'Ainda não configurado'}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" color="inherit" disabled={saving} onClick={() => setForm(toForm(settings))}>
                  Descartar
                </Button>
                <LoadingButton variant="contained" loading={saving} disabled={budgetInvalid} onClick={save}>
                  Salvar
                </LoadingButton>
              </Stack>
            </Stack>
          </Stack>
        </Card>
      </Grid>

      <Grid xs={12} md={5}>
        <UsageCard usage={settings.usage} budget={settings.monthlyTokenBudget} />
      </Grid>
    </Grid>
  );
}

// ----------------------------------------------------------------------

type ToolsSectionProps = {
  tools: CrmAiTool[];
  enabled: string[];
  onChange: (enabled: string[]) => void;
};

function ToolsSection({ tools, enabled, onChange }: ToolsSectionProps) {
  const toggle = (name: string, on: boolean) => {
    const next = on ? [...enabled.filter((n) => n !== name), name] : enabled.filter((n) => n !== name);
    // Mantém a ordem do catálogo para o PUT ficar estável.
    onChange(tools.map((t) => t.name).filter((n) => next.includes(n)));
  };

  const hasSensitive = tools.some((t) => t.sensitive);

  return (
    <Stack spacing={1.5}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">Ferramentas da IA</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          O que a IA pode consultar ou fazer sozinha durante o atendimento. Ferramenta desligada não é usada.
        </Typography>
      </Stack>

      {hasSensitive && (
        <Alert severity="info" icon={<Iconify icon="solar:shield-user-bold" />}>
          Antes de informar dados financeiros, notas ou frequência, a IA confirma a identidade do contato (telefone
          cadastrado + pergunta de verificação).
        </Alert>
      )}

      {!tools.length && (
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          Nenhuma ferramenta disponível.
        </Typography>
      )}

      <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={1}>
        {tools.map((tool) => (
          <FormControlLabel
            key={tool.name}
            sx={{ alignItems: 'flex-start', mx: 0, justifyContent: 'space-between', gap: 2 }}
            labelPlacement="start"
            control={
              <Switch checked={enabled.includes(tool.name)} onChange={(e) => toggle(tool.name, e.target.checked)} />
            }
            label={
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {tool.label}
                  </Typography>
                  {tool.sensitive && (
                    <Chip
                      size="small"
                      color="warning"
                      variant="soft"
                      icon={<Iconify icon="solar:shield-user-bold" width={14} />}
                      label="exige verificação de identidade"
                    />
                  )}
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {tool.description}
                </Typography>
              </Stack>
            }
          />
        ))}
      </Stack>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function UsageCard({ usage, budget }: { usage: CrmAiUsage; budget: number }) {
  const percent = budget > 0 ? (usage.tokens / budget) * 100 : null;
  const color = percent == null ? 'primary' : percent >= 100 ? 'error' : percent >= 80 ? 'warning' : 'primary';

  const stat = (label: string, value: string) => (
    <Stack spacing={0.25}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="h5">{value}</Typography>
    </Stack>
  );

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle1">Consumo do mês</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          desde {fDate(usage.since, 'DD/MM/YYYY')}
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        <Grid xs={6}>{stat('Tokens', fInt(usage.tokens))}</Grid>
        <Grid xs={6}>{stat('Custo estimado', fUsd(usage.costUsd))}</Grid>
        <Grid xs={6}>{stat('Execuções', fInt(usage.runs))}</Grid>
        <Grid xs={6}>{stat('Teto mensal', budget > 0 ? fInt(budget) : 'Sem teto')}</Grid>
      </Grid>

      {percent != null && (
        <Stack spacing={0.75} sx={{ mt: 3 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Uso do teto
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: `${color}.main` }}>
              {new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(percent)}%
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" color={color} value={Math.min(100, percent)} />
          {percent >= 100 && (
            <Typography variant="caption" sx={{ color: 'error.main' }}>
              Teto atingido: a IA não atende até o próximo mês ou até o teto ser aumentado.
            </Typography>
          )}
        </Stack>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        Decisões
      </Typography>
      <Stack spacing={1}>
        {DECISIONS.map((d) => (
          <Stack key={d} direction="row" alignItems="center" justifyContent="space-between">
            <Label variant="soft" color={CRM_AI_DECISION_COLORS[d]}>
              {CRM_AI_DECISION_LABELS[d]}
            </Label>
            <Typography variant="body2">{fInt(usage.byDecision?.[d] ?? 0)}</Typography>
          </Stack>
        ))}
      </Stack>

      <Button
        fullWidth
        variant="outlined"
        sx={{ mt: 3 }}
        component={RouterLink}
        href={paths.dashboard.intelligence.historico}
      >
        Ver histórico
      </Button>
    </Card>
  );
}

'use client';

import type {
  CrmCampaign,
  CrmWaTemplate,
  CrmCampaignOptions,
  CrmAudiencePreview,
  CrmCampaignAudience,
  CrmCampaignAudienceType,
  CrmCampaignVariableMapping,
} from 'src/types/services/crm-campaign';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import MenuItem from '@mui/material/MenuItem';
import StepLabel from '@mui/material/StepLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';

import { fNumber } from 'src/utils/format-number';

import { CrmCampaignService } from 'src/services/crm-campaign';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { CRM_AUDIENCE_LABELS } from 'src/types/services/crm-campaign';

import { CrmTemplatePreview, templateVariableLabel } from '../templates/crm-template-preview';

// ----------------------------------------------------------------------

const STEPS = ['Canal e template', 'Variáveis', 'Público', 'Envio'];

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (campaign: CrmCampaign) => void;
};

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CrmCampaignCreateDialog({ open, onClose, onCreated }: Props) {
  const [step, setStep] = useState(0);
  const [options, setOptions] = useState<CrmCampaignOptions | null>(null);
  const [templates, setTemplates] = useState<CrmWaTemplate[]>([]);

  const [name, setName] = useState('');
  const [channelId, setChannelId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [variables, setVariables] = useState<CrmCampaignVariableMapping>({});
  const [audienceType, setAudienceType] = useState<CrmCampaignAudienceType>('all_guardians');
  const [classroomIds, setClassroomIds] = useState<string[]>([]);
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [minDaysOverdue, setMinDaysOverdue] = useState(1);
  const [csv, setCsv] = useState('');
  const [csvName, setCsvName] = useState('');
  const [preview, setPreview] = useState<CrmAudiencePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [schedule, setSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(new Date(Date.now() + 3600_000)));
  const [rate, setRate] = useState(30);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setName('');
    setTemplateId('');
    setVariables({});
    setAudienceType('all_guardians');
    setClassroomIds([]);
    setCourseIds([]);
    setTagIds([]);
    setCsv('');
    setCsvName('');
    setPreview(null);
    setSchedule(false);
    CrmCampaignService.options()
      .then((o) => {
        setOptions(o);
        setRate(o.defaults.ratePerMinute);
        const first = o.channels.find((c) => c.eligible);
        setChannelId(first?.id ?? '');
      })
      .catch((err) => toast.error(err?.message || 'Erro ao carregar opções de campanha'));
  }, [open]);

  useEffect(() => {
    if (!channelId) {
      setTemplates([]);
      return;
    }
    CrmCampaignService.listTemplates({ channelId, status: 'APPROVED' })
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, [channelId]);

  const template = templates.find((t) => t.id === templateId) ?? null;

  useEffect(() => {
    if (!template) return;
    setVariables((prev) => {
      const next: CrmCampaignVariableMapping = {};
      template.variables.forEach((key) => {
        next[key] = prev[key] ?? { source: 'guardian_name' };
      });
      return next;
    });
  }, [template]);

  // Audiência mudou: a prévia anterior não vale mais.
  useEffect(() => {
    setPreview(null);
  }, [audienceType, classroomIds, courseIds, tagIds, minDaysOverdue, csv, variables, templateId, channelId]);

  const audience = useMemo<CrmCampaignAudience>(() => {
    switch (audienceType) {
      case 'classroom':
        return { type: 'classroom', classroomIds };
      case 'course':
        return { type: 'course', courseIds };
      case 'overdue':
        return { type: 'overdue', minDaysOverdue };
      case 'tag':
        return { type: 'tag', tagIds };
      case 'csv':
        return { type: 'csv', csv };
      default:
        return { type: 'all_guardians' };
    }
  }, [audienceType, classroomIds, courseIds, tagIds, minDaysOverdue, csv]);

  const audienceReady =
    (audienceType === 'classroom' && classroomIds.length > 0) ||
    (audienceType === 'course' && courseIds.length > 0) ||
    (audienceType === 'tag' && tagIds.length > 0) ||
    (audienceType === 'csv' && csv.trim().length > 0) ||
    audienceType === 'all_guardians' ||
    audienceType === 'overdue';

  const variablesReady =
    !!template &&
    template.variables.every((k) => {
      const v = variables[k];
      return v && v.source && (v.source !== 'static' || !!v.value?.trim());
    });

  const maxRate = options?.defaults.maxRatePerMinute ?? 60;

  const canNext = [!!name.trim() && !!channelId && !!template, variablesReady, audienceReady && !!preview && preview.total > 0, true][step];

  const runPreview = async () => {
    if (!template) return;
    setPreviewing(true);
    try {
      setPreview(await CrmCampaignService.previewAudience({ channelId, templateId, variables, audience }));
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao montar o público');
    } finally {
      setPreviewing(false);
    }
  };

  const submit = async (start: boolean) => {
    setSaving(true);
    try {
      let campaign = await CrmCampaignService.create({
        name: name.trim(),
        channelId,
        templateId,
        variables,
        audience,
        scheduledAt: schedule ? new Date(scheduledAt).toISOString() : null,
        ratePerMinute: Math.min(Math.max(1, rate), maxRate),
      });
      if (start) campaign = await CrmCampaignService.action(campaign.id, 'start');
      toast.success(start ? (schedule ? 'Campanha agendada' : 'Campanha iniciada') : 'Rascunho salvo');
      onCreated(campaign);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao criar campanha');
    } finally {
      setSaving(false);
    }
  };

  const onCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCsv(String(reader.result ?? ''));
      setCsvName(file.name);
    };
    reader.readAsText(file, 'utf-8');
  };

  const sampleValues = preview?.sample[0]?.variables ?? {};
  const blockedChannels = options?.channels.filter((c) => !c.eligible) ?? [];

  const renderStep0 = (
    <Stack spacing={2.5}>
      <TextField label="Nome da campanha" value={name} onChange={(e) => setName(e.target.value)} inputProps={{ maxLength: 120 }} />
      <TextField select label="Canal (oficial)" value={channelId} onChange={(e) => setChannelId(e.target.value)}>
        {(options?.channels ?? []).map((c) => (
          <MenuItem key={c.id} value={c.id} disabled={!c.eligible}>
            <Stack>
              <span>
                {c.name} {c.official ? '· oficial' : '· não oficial'}
              </span>
              {!c.eligible && c.reason && (
                <Typography variant="caption" sx={{ color: 'error.main', whiteSpace: 'normal' }}>
                  {c.reason}
                </Typography>
              )}
            </Stack>
          </MenuItem>
        ))}
      </TextField>
      {blockedChannels.length > 0 && (
        <Alert severity="warning">
          Campanhas só podem sair pela API oficial da Meta. Canais não oficiais (WAHA) ficam bloqueados para envio em massa por risco
          de banimento do número.
        </Alert>
      )}
      {options && !options.channels.some((c) => c.eligible) && (
        <Alert severity="error">Nenhum canal oficial (Meta) disponível. Cadastre um canal da WhatsApp Cloud API em CRM &gt; Canais.</Alert>
      )}
      <TextField
        select
        label="Template aprovado"
        value={templateId}
        onChange={(e) => setTemplateId(e.target.value)}
        disabled={!channelId}
        helperText={channelId && !templates.length ? 'Nenhum template aprovado neste canal. Sincronize em CRM > Templates.' : ' '}
      >
        {templates.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            {t.name} ({t.language})
          </MenuItem>
        ))}
      </TextField>
      {template && <CrmTemplatePreview template={template} />}
    </Stack>
  );

  const renderStep1 = template && (
    <Stack spacing={2}>
      {!template.variables.length && <Alert severity="info">Este template não tem variáveis.</Alert>}
      {template.variables.map((key) => {
        const v = variables[key] ?? { source: '' };
        return (
          <Stack key={key} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Typography variant="subtitle2" sx={{ minWidth: 140 }}>
              {templateVariableLabel(key)}
            </Typography>
            <TextField
              select
              size="small"
              label="Campo"
              value={v.source}
              onChange={(e) => setVariables((prev) => ({ ...prev, [key]: { ...prev[key], source: e.target.value } }))}
              sx={{ minWidth: 220 }}
            >
              {(options?.sources ?? []).map((s) => (
                <MenuItem key={s.key} value={s.key}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label={v.source === 'static' ? 'Texto fixo' : 'Valor se vazio (opcional)'}
              value={v.value ?? ''}
              onChange={(e) => setVariables((prev) => ({ ...prev, [key]: { ...prev[key], value: e.target.value } }))}
              sx={{ flex: 1 }}
            />
          </Stack>
        );
      })}
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Valor e vencimento vêm das mensalidades vencidas (público Inadimplentes) ou das colunas valor/vencimento do CSV.
      </Typography>
    </Stack>
  );

  const renderStep2 = (
    <Stack spacing={2}>
      <TextField select label="Público" value={audienceType} onChange={(e) => setAudienceType(e.target.value as CrmCampaignAudienceType)}>
        {(Object.keys(CRM_AUDIENCE_LABELS) as CrmCampaignAudienceType[]).map((k) => (
          <MenuItem key={k} value={k}>
            {CRM_AUDIENCE_LABELS[k]}
          </MenuItem>
        ))}
      </TextField>

      {audienceType === 'classroom' && (
        <Autocomplete
          multiple
          options={options?.classrooms ?? []}
          getOptionLabel={(o) => `${o.name}${o.courseName ? ` · ${o.courseName}` : ''}`}
          value={(options?.classrooms ?? []).filter((c) => classroomIds.includes(c.id))}
          onChange={(_e, v) => setClassroomIds(v.map((c) => c.id))}
          renderInput={(params) => <TextField {...params} label="Turmas" />}
        />
      )}
      {audienceType === 'course' && (
        <Autocomplete
          multiple
          options={options?.courses ?? []}
          getOptionLabel={(o) => o.name}
          value={(options?.courses ?? []).filter((c) => courseIds.includes(c.id))}
          onChange={(_e, v) => setCourseIds(v.map((c) => c.id))}
          renderInput={(params) => <TextField {...params} label="Cursos" />}
        />
      )}
      {audienceType === 'tag' && (
        <Autocomplete
          multiple
          options={options?.tags ?? []}
          getOptionLabel={(o) => o.name}
          value={(options?.tags ?? []).filter((t) => tagIds.includes(t.id))}
          onChange={(_e, v) => setTagIds(v.map((t) => t.id))}
          renderTags={(value, getTagProps) =>
            value.map((t, i) => (
              <Chip {...getTagProps({ index: i })} key={t.id} label={t.name} size="small" sx={{ bgcolor: t.color, color: '#fff' }} />
            ))
          }
          renderInput={(params) => <TextField {...params} label="Tags de contato" />}
        />
      )}
      {audienceType === 'overdue' && (
        <TextField
          type="number"
          label="Vencidas há pelo menos (dias)"
          value={minDaysOverdue}
          onChange={(e) => setMinDaysOverdue(Math.max(0, Number(e.target.value) || 0))}
          helperText="Responsáveis (ou o aluno, sem responsável) com mensalidade vencida e não paga."
        />
      )}
      {audienceType === 'csv' && (
        <Stack spacing={1}>
          <Button variant="outlined" component="label" startIcon={<Iconify icon="solar:upload-bold" />}>
            {csvName || 'Escolher arquivo CSV'}
            <input
              hidden
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onCsvFile(file);
                e.target.value = '';
              }}
            />
          </Button>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Cabeçalho obrigatório com a coluna <b>telefone</b>; opcionais: nome, nome_responsavel, nome_aluno, valor, vencimento.
            Separador vírgula ou ponto e vírgula.
          </Typography>
        </Stack>
      )}

      <Alert severity="info" icon={<Iconify icon="solar:shield-check-bold" />}>
        Contatos que responderam SAIR/PARAR nunca recebem campanha — eles são descartados automaticamente.
      </Alert>

      <LoadingButton variant="contained" color="inherit" loading={previewing} disabled={!audienceReady} onClick={runPreview}>
        Montar prévia do público
      </LoadingButton>

      {preview && (
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip color="primary" label={`${fNumber(preview.total)} destinatário(s)`} />
            <Chip variant="outlined" label={`${fNumber(preview.optedOut)} opt-out (SAIR)`} />
            <Chip variant="outlined" label={`${fNumber(preview.invalid)} telefone(s) inválido(s)`} />
            <Chip variant="outlined" label={`${fNumber(preview.duplicates)} duplicado(s)`} />
          </Stack>
          {preview.total === 0 && <Alert severity="warning">Nenhum destinatário elegível com este público.</Alert>}
          {preview.sample.slice(0, 3).map((s) => (
            <Box key={s.phone}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {s.name || 'Sem nome'} · +{s.phone}
              </Typography>
              {template && <CrmTemplatePreview template={template} values={s.variables} />}
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );

  const renderStep3 = (
    <Stack spacing={2.5}>
      <FormControlLabel control={<Switch checked={schedule} onChange={(e) => setSchedule(e.target.checked)} />} label="Agendar o envio" />
      {schedule && (
        <TextField
          type="datetime-local"
          label="Data e hora do início"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      )}
      <TextField
        type="number"
        label="Ritmo (mensagens por minuto)"
        value={rate}
        onChange={(e) => setRate(Number(e.target.value) || 1)}
        inputProps={{ min: 1, max: maxRate }}
        error={rate > maxRate || rate < 1}
        helperText={`Máximo ${maxRate}/min. Limite diário do canal (tier da Meta): ${fNumber(options?.defaults.dailyLimit ?? 0)} contatos em 24h.`}
      />
      {preview && (
        <Alert severity="info">
          {fNumber(preview.total)} destinatário(s). Duração estimada: ~{Math.ceil(preview.total / Math.max(1, Math.min(rate, maxRate)))} min.
        </Alert>
      )}
      <Divider />
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Você pode salvar como rascunho e iniciar depois pela tela da campanha.
      </Typography>
    </Stack>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Nova campanha</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 3, mt: 1 }}>
          {STEPS.map((s) => (
            <Step key={s}>
              <StepLabel>{s}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {step === 0 && renderStep0}
        {step === 1 && renderStep1}
        {step === 2 && renderStep2}
        {step === 3 && renderStep3}
        {step > 0 && template && step !== 2 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Prévia
            </Typography>
            <CrmTemplatePreview template={template} values={sampleValues} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Box sx={{ flex: 1 }} />
        {step > 0 && <Button onClick={() => setStep(step - 1)}>Voltar</Button>}
        {step < STEPS.length - 1 && (
          <Button variant="contained" disabled={!canNext} onClick={() => setStep(step + 1)}>
            Avançar
          </Button>
        )}
        {step === STEPS.length - 1 && (
          <>
            <LoadingButton variant="outlined" loading={saving} onClick={() => submit(false)}>
              Salvar rascunho
            </LoadingButton>
            <LoadingButton variant="contained" loading={saving} onClick={() => submit(true)} disabled={rate < 1 || rate > maxRate}>
              {schedule ? 'Criar e agendar' : 'Criar e iniciar'}
            </LoadingButton>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

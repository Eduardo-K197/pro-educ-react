'use client';

import type { CrmChannel, CrmDepartment, CrmChannelPayload } from 'src/types/services/crm';

import { useState, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useSchoolModules } from 'src/hooks/use-school-modules';

import { CRM_AI_MODULE_LABEL } from 'src/types/services/crm-ai';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  current?: CrmChannel | null;
  departments: CrmDepartment[];
  onClose: () => void;
  onSubmit: (payload: CrmChannelPayload) => Promise<void>;
};

const TYPES = [
  { value: 'waha', label: 'WhatsApp não oficial (WAHA, QR code)' },
  { value: 'meta-cloud', label: 'WhatsApp oficial (Cloud API da Meta)' },
];

/** Segredo já salvo: campo vazio mantém o valor atual. */
const secretHelp = (current: CrmChannel | null | undefined, field: string) =>
  current?.config?.[field]?.set ? 'Já configurado — deixe em branco para manter.' : undefined;

export function CrmChannelFormDialog({ open, current, departments, onClose, onSubmit }: Props) {
  const [type, setType] = useState('waha');
  const [name, setName] = useState('');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [automation, setAutomation] = useState({
    defaultDepartmentId: '',
    greetingMessage: '',
    closingMessage: '',
    botMenuEnabled: false,
    botMenuMessage: '',
    ratingEnabled: false,
    agentsSeeUnassigned: true,
  });
  const [aiEnabled, setAiEnabled] = useState(false);
  const { modules } = useSchoolModules();
  const intelligence = modules.crm && modules.intelligence;
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(current?.type ?? 'waha');
    setName(current?.name ?? '');
    const plain: Record<string, string> = {};
    Object.entries(current?.config ?? {}).forEach(([k, v]) => {
      if (typeof v === 'string') plain[k] = v;
    });
    setConfig(plain);
    const a = current?.automation;
    setAutomation({
      defaultDepartmentId: a?.defaultDepartmentId ?? '',
      greetingMessage: a?.greetingMessage ?? '',
      closingMessage: a?.closingMessage ?? '',
      botMenuEnabled: !!a?.botMenuEnabled,
      botMenuMessage: a?.botMenuMessage ?? '',
      ratingEnabled: !!a?.ratingEnabled,
      agentsSeeUnassigned: a?.agentsSeeUnassigned ?? true,
    });
    setAiEnabled(!!a?.aiEnabled);
  }, [open, current]);

  const field = (key: string, label: string, opts: { secret?: boolean; helper?: string; placeholder?: string } = {}) => (
    <TextField
      label={label}
      type={opts.secret ? 'password' : 'text'}
      value={config[key] ?? ''}
      placeholder={opts.placeholder}
      onChange={(e) => setConfig((c) => ({ ...c, [key]: e.target.value }))}
      helperText={opts.secret ? secretHelp(current, key) ?? opts.helper : opts.helper}
      autoComplete="off"
    />
  );

  const submit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        ...(current ? {} : { type }),
        name: name.trim(),
        config,
        ...automation,
        defaultDepartmentId: automation.defaultDepartmentId || null,
        // Só envia com o módulo ligado: sem ele a API não conhece/aceita a IA.
        ...(intelligence ? { aiEnabled } : {}),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{current ? 'Editar canal' : 'Novo canal'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField select label="Tipo" value={type} disabled={!!current} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Nome do canal" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Secretaria WhatsApp" />

          {type === 'waha' ? (
            <>
              <Alert severity="info">
                Canal não oficial: atende quem mandar mensagem, mas nunca inicia conversa. Deixe os campos em branco para
                usar a WAHA padrão do servidor.
              </Alert>
              {field('baseUrl', 'URL da WAHA (opcional)', { placeholder: 'https://waha.exemplo.com.br' })}
              {field('apiKey', 'API key da WAHA (opcional)', { secret: true })}
              {field('session', 'Nome da sessão (opcional)', { helper: 'WAHA Core só aceita "default".' })}
            </>
          ) : (
            <>
              <Alert severity="info">
                Dados do WhatsApp Manager / app da Meta. Configure o webhook na Meta com a URL mostrada no canal após salvar.
              </Alert>
              {field('phoneNumberId', 'Phone number ID')}
              {field('wabaId', 'WABA ID (conta do WhatsApp Business)')}
              {field('accessToken', 'Token de acesso (permanente)', { secret: true })}
              {field('appSecret', 'App Secret (assinatura do webhook)', { secret: true })}
              {field('verifyToken', 'Verify token do webhook', { secret: true })}
            </>
          )}

          <Divider />
          <Typography variant="subtitle2">Atendimento automático</Typography>
          <TextField
            select
            label="Setor padrão das conversas novas"
            value={automation.defaultDepartmentId}
            onChange={(e) => setAutomation((a) => ({ ...a, defaultDepartmentId: e.target.value }))}
          >
            <MenuItem value="">(sem setor)</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Saudação"
            helperText="Enviada ao abrir uma conversa nova. Use {{nome}} e {{protocolo}}."
            value={automation.greetingMessage}
            onChange={(e) => setAutomation((a) => ({ ...a, greetingMessage: e.target.value }))}
            multiline
            minRows={2}
          />
          <FormControlLabel
            control={
              <Switch checked={automation.botMenuEnabled} onChange={(e) => setAutomation((a) => ({ ...a, botMenuEnabled: e.target.checked }))} />
            }
            label="Menu de escolha de setor para conversas novas"
          />
          {automation.botMenuEnabled && (
            <TextField
              label="Texto do menu"
              helperText="As opções numeradas dos setores ativos são adicionadas automaticamente."
              value={automation.botMenuMessage}
              onChange={(e) => setAutomation((a) => ({ ...a, botMenuMessage: e.target.value }))}
              multiline
              minRows={2}
            />
          )}
          <TextField
            label="Mensagem de encerramento"
            helperText="Use {{nome}}, {{protocolo}} e {{atendente}}."
            value={automation.closingMessage}
            onChange={(e) => setAutomation((a) => ({ ...a, closingMessage: e.target.value }))}
            multiline
            minRows={2}
          />
          <FormControlLabel
            control={
              <Switch checked={automation.ratingEnabled} onChange={(e) => setAutomation((a) => ({ ...a, ratingEnabled: e.target.checked }))} />
            }
            label="Pedir avaliação (1 a 5) ao encerrar"
          />
          <FormControlLabel
            control={
              <Switch
                checked={automation.agentsSeeUnassigned}
                onChange={(e) => setAutomation((a) => ({ ...a, agentsSeeUnassigned: e.target.checked }))}
              />
            }
            label="Agentes veem conversas pendentes sem setor"
          />
          {intelligence && (
            <>
              <FormControlLabel
                control={<Switch checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} />}
                label="Autoatendimento com IA"
              />
              {aiEnabled && (
                <Alert severity="info">
                  A IA ({CRM_AI_MODULE_LABEL}) atende as conversas novas deste canal conforme o modo definido em
                  Intelligence › Autoatendimento e passa para a equipe quando necessário.
                </Alert>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancelar
        </Button>
        <LoadingButton variant="contained" loading={submitting} disabled={name.trim().length < 2} onClick={submit}>
          {current ? 'Salvar' : 'Criar canal'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

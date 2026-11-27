'use client';

import type { CrmWaTemplate } from 'src/types/services/crm-campaign';
import type { CrmMessage, CrmConversation } from 'src/types/services/crm';

import { useState, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { CrmService } from 'src/services/crm';
import { CrmCampaignService } from 'src/services/crm-campaign';

import { toast } from 'src/components/snackbar';

import { CrmTemplatePreview, templateVariableLabel } from '../templates/crm-template-preview';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  conversation: CrmConversation;
  onSent: (message: CrmMessage) => void;
};

/** Envio de template aprovado (fora da janela de 24h ou para retomar o contato). */
export function CrmTemplateDialog({ open, onClose, conversation, onSent }: Props) {
  const [templates, setTemplates] = useState<CrmWaTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateId, setTemplateId] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTemplateId('');
    setValues({});
    setLoading(true);
    CrmCampaignService.listTemplates({ channelId: conversation.channel.id, status: 'APPROVED' })
      .then(setTemplates)
      .catch((err) => toast.error(err?.message || 'Erro ao carregar templates'))
      .finally(() => setLoading(false));
  }, [open, conversation.channel.id]);

  const template = templates.find((t) => t.id === templateId) ?? null;
  const missing = template ? template.variables.filter((k) => !values[k]?.trim()) : [];

  const send = async () => {
    if (!template) return;
    setSending(true);
    try {
      const message = await CrmService.sendTemplate(conversation.id, template.id, values);
      onSent(message);
      toast.success('Template enviado');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar template');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Enviar template</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="info">
            Fora da janela de 24h desde a última mensagem do contato, a Meta só permite mensagens de template aprovado.
          </Alert>
          <TextField
            select
            label="Template aprovado"
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value);
              setValues({});
            }}
            helperText={!loading && !templates.length ? 'Nenhum template aprovado neste canal. Um gestor pode sincronizar em CRM > Templates.' : ' '}
          >
            {templates.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name} ({t.language})
              </MenuItem>
            ))}
          </TextField>
          {template?.variables.map((key) => (
            <TextField
              key={key}
              size="small"
              label={templateVariableLabel(key)}
              value={values[key] ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
            />
          ))}
          {template && <CrmTemplatePreview template={template} values={values} />}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <LoadingButton variant="contained" loading={sending} disabled={!template || missing.length > 0} onClick={send}>
          Enviar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

'use client';

import type { CrmConversation, CrmChannelSummary } from 'src/types/services/crm';

import { useState, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { CrmService } from 'src/services/crm';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  channels: CrmChannelSummary[];
  onDone: (conversation: CrmConversation) => void;
};

/**
 * Iniciar conversa. Canal oficial: só com template aprovado na Meta.
 * Canal não oficial: bloqueado para quem nunca escreveu (a API confirma).
 */
export function CrmStartDialog({ open, onClose, channels, onDone }: Props) {
  const [channelId, setChannelId] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('');
  const [language, setLanguage] = useState('pt_BR');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const channel = channels.find((c) => c.id === channelId);

  useEffect(() => {
    if (open) {
      const official = channels.find((c) => c.official);
      setChannelId(official?.id ?? channels[0]?.id ?? '');
      setPhone('');
      setName('');
      setTemplate('');
      setText('');
    }
  }, [open, channels]);

  const submit = async () => {
    if (!channel) return;
    setSaving(true);
    try {
      const conv = await CrmService.startConversation({
        channelId: channel.id,
        phone,
        name: name || undefined,
        ...(channel.templates ? { template: { name: template.trim(), language } } : { text: text.trim() }),
      });
      toast.success('Conversa iniciada');
      onDone(conv);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível iniciar a conversa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Nova conversa</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField select label="Canal" value={channelId} onChange={(e) => setChannelId(e.target.value)}>
            {channels.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} — {c.official ? 'oficial' : 'não oficial'}
              </MenuItem>
            ))}
          </TextField>
          {channel && !channel.canInitiate && (
            <Alert severity="warning">
              Canal não oficial: só é possível falar com quem já mandou mensagem para este número. Para
              iniciar uma conversa nova use o canal oficial com um template aprovado.
            </Alert>
          )}
          <TextField label="Telefone (com DDD)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <TextField label="Nome do contato (opcional)" value={name} onChange={(e) => setName(e.target.value)} />
          {channel?.templates ? (
            <>
              <TextField
                label="Nome do template aprovado"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                helperText="Exatamente como cadastrado no WhatsApp Manager."
              />
              <TextField label="Idioma" value={language} onChange={(e) => setLanguage(e.target.value)} />
            </>
          ) : (
            <TextField label="Mensagem" value={text} onChange={(e) => setText(e.target.value)} multiline minRows={2} />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={saving || !channel || phone.replace(/\D/g, '').length < 10 || (channel.templates ? !template.trim() : !text.trim())}
        >
          Iniciar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

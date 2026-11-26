'use client';

import type { CrmConversation } from 'src/types/services/crm';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Rating from '@mui/material/Rating';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { CrmService } from 'src/services/crm';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  conversation: CrmConversation;
  onDone: (conversation: CrmConversation) => void;
};

export function CrmCloseDialog({ open, onClose, conversation, onDone }: Props) {
  const [sendClosing, setSendClosing] = useState(true);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSendClosing(true);
      setMessage('');
      setRating(null);
    }
  }, [open]);

  const submit = async () => {
    setSaving(true);
    try {
      const updated = await CrmService.closeConversation(conversation.id, {
        sendClosingMessage: sendClosing,
        message: message.trim() || null,
        rating,
      });
      toast.success('Conversa encerrada');
      onDone(updated);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao encerrar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Encerrar conversa</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <FormControlLabel
            control={<Switch checked={sendClosing} onChange={(e) => setSendClosing(e.target.checked)} />}
            label="Enviar a mensagem de encerramento do canal"
          />
          <TextField
            label="Mensagem personalizada (opcional)"
            helperText="Se preenchida, substitui a mensagem de encerramento do canal."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            multiline
            minRows={2}
          />
          <Stack spacing={0.5}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Avaliação do atendimento (opcional). Sem nota, o contato recebe a pesquisa se o canal tiver avaliação ativa.
            </Typography>
            <Rating value={rating} onChange={(_e, v) => setRating(v)} />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" color="error" onClick={submit} disabled={saving}>
          Encerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

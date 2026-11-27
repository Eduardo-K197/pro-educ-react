'use client';

import type { CrmMessage, CrmQuickReply } from 'src/types/services/crm';

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ToggleButton from '@mui/material/ToggleButton';
import ListItemButton from '@mui/material/ListItemButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { CrmService } from 'src/services/crm';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/** Texto colocado no campo de envio de fora (ex.: sugestão da IA). Nunca é enviado sozinho. */
export type CrmMessageDraft = {
  conversationId: string;
  text: string;
  focus: boolean;
  /** Muda a cada aplicação, para reaplicar o mesmo texto. */
  nonce: number;
};

type Props = {
  conversationId: string;
  /** Motivo para bloquear o envio ao contato (notas continuam liberadas). */
  disabledReason?: string | null;
  replyTo: CrmMessage | null;
  onCancelReply: () => void;
  onSent: (message: CrmMessage) => void;
  onNote: (body: string) => Promise<void>;
  /** Preenche o campo de envio (o atendente revisa e envia). */
  draft?: CrmMessageDraft | null;
  /** Conteúdo exibido logo acima do campo (ex.: card de sugestão da IA). */
  slotAbove?: React.ReactNode;
  /** Abre o envio de template (canal oficial). Ausente = canal sem template. */
  onOpenTemplate?: () => void;
};

export function CrmMessageInput({
  conversationId,
  disabledReason,
  replyTo,
  onCancelReply,
  onSent,
  onNote,
  draft,
  slotAbove,
  onOpenTemplate,
}: Props) {
  const [mode, setMode] = useState<'message' | 'note'>('message');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [quickReplies, setQuickReplies] = useState<CrmQuickReply[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [recording, setRecording] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    CrmService.listQuickReplies()
      .then(setQuickReplies)
      .catch(() => setQuickReplies([]));
  }, []);

  useEffect(() => {
    setText('');
    setMode('message');
  }, [conversationId]);

  useEffect(() => {
    if (!draft || draft.conversationId !== conversationId) return;
    setMode('message');
    setText(draft.text);
    if (draft.focus) {
      // Espera o campo reabilitar/renderizar antes de focar e pôr o cursor no fim.
      setTimeout(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        const end = el.value.length;
        el.setSelectionRange(end, end);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const blocked = mode === 'message' && !!disabledReason;

  // "/atalho" no início do texto abre as respostas rápidas.
  const slash = mode === 'message' && /^\/[\w-]*$/.test(text) ? text.slice(1).toLowerCase() : null;
  const suggestions = useMemo(
    () => (slash === null ? [] : quickReplies.filter((q) => q.shortcut.startsWith(slash)).slice(0, 8)),
    [slash, quickReplies]
  );

  const applyQuickReply = useCallback(
    async (q: CrmQuickReply) => {
      if (q.media?.key) {
        try {
          setSending(true);
          const sent = await CrmService.sendQuickReplyMedia(conversationId, q.media.key, q.body, q.media.fileName);
          onSent(sent);
          setText('');
        } catch (err: any) {
          toast.error(err?.message || 'Erro ao enviar resposta rápida');
        } finally {
          setSending(false);
        }
        return;
      }
      setText(q.body);
    },
    [conversationId, onSent]
  );

  const send = useCallback(async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      if (mode === 'note') {
        await onNote(value);
      } else {
        const sent = await CrmService.sendText(conversationId, value, replyTo?.id);
        onSent(sent);
        onCancelReply();
      }
      setText('');
    } catch (err: any) {
      if (err?.response?.data?.code === 'WINDOW_CLOSED' && onOpenTemplate) {
        toast.warning('A janela de 24h fechou: envie um template aprovado.');
        onOpenTemplate();
      } else {
        toast.error(err?.message || 'Erro ao enviar');
      }
    } finally {
      setSending(false);
    }
  }, [text, sending, mode, onNote, conversationId, replyTo, onSent, onCancelReply, onOpenTemplate]);

  const sendFile = useCallback(
    async (file: File | Blob, fileName?: string) => {
      setSending(true);
      try {
        const sent = await CrmService.sendMedia(conversationId, file, {
          text: text.trim() || undefined,
          fileName,
          quotedMessageId: replyTo?.id,
        });
        onSent(sent);
        setText('');
        onCancelReply();
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao enviar arquivo');
      } finally {
        setSending(false);
      }
    },
    [conversationId, text, replyTo, onSent, onCancelReply]
  );

  const toggleRecording = useCallback(async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error('Gravação de áudio não suportada neste navegador');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm'].find((m) => MediaRecorder.isTypeSupported(m));
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const type = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size > 0) sendFile(blob, `audio-${Date.now()}.${type.includes('ogg') ? 'ogg' : 'webm'}`);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      toast.error('Não foi possível acessar o microfone');
    }
  }, [recording, sendFile]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (suggestions.length) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlight((h) => (h + (event.key === 'ArrowDown' ? 1 : suggestions.length - 1)) % suggestions.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        applyQuickReply(suggestions[Math.min(highlight, suggestions.length - 1)]);
        return;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <Box sx={{ borderTop: (theme) => `solid 1px ${theme.vars.palette.divider}`, position: 'relative' }}>
      {suggestions.length > 0 && (
        <Paper elevation={8} sx={{ position: 'absolute', bottom: '100%', left: 8, right: 8, mb: 1, zIndex: 10, maxHeight: 280, overflow: 'auto' }}>
          <List dense disablePadding>
            {suggestions.map((q, i) => (
              <ListItemButton key={q.id} selected={i === highlight} onClick={() => applyQuickReply(q)}>
                <ListItemText
                  primary={`/${q.shortcut}${q.media ? ' 📎' : ''}`}
                  secondary={q.body}
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      {replyTo && mode === 'message' && (
        <Stack direction="row" alignItems="center" sx={{ px: 2, pt: 1 }}>
          <Box sx={{ flex: 1, px: 1, borderLeft: (theme) => `3px solid ${theme.vars.palette.primary.main}` }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap component="div">
              Respondendo: {replyTo.body || `[${replyTo.type}]`}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onCancelReply}>
            <Iconify icon="mingcute:close-line" width={16} />
          </IconButton>
        </Stack>
      )}

      {slotAbove}

      {blocked && (
        <Alert
          severity="info"
          sx={{ mx: 2, mt: 1, py: 0 }}
          action={
            onOpenTemplate ? (
              <Button size="small" color="inherit" onClick={onOpenTemplate}>
                Enviar template
              </Button>
            ) : undefined
          }
        >
          {disabledReason}
        </Alert>
      )}

      <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ px: 1.5, py: 1 }}>
        <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_e, v) => v && setMode(v)} sx={{ alignSelf: 'center' }}>
          <ToggleButton value="message">
            <Tooltip title="Mensagem para o contato">
              <Iconify icon="solar:chat-round-line-bold" width={18} />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="note">
            <Tooltip title="Nota interna (só a equipe vê)">
              <Iconify icon="solar:notes-bold" width={18} />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        <InputBase
          inputRef={inputRef}
          multiline
          maxRows={6}
          value={text}
          disabled={blocked || sending || recording}
          onChange={(e) => {
            setText(e.target.value);
            setHighlight(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={
            recording
              ? 'Gravando áudio... clique no microfone para enviar'
              : mode === 'note'
                ? 'Nota interna (não vai para o contato)'
                : 'Digite a mensagem ou / para respostas rápidas'
          }
          sx={{
            flex: 1,
            px: 1.5,
            py: 1,
            borderRadius: 1,
            bgcolor: mode === 'note' ? 'warning.lighter' : 'background.neutral',
            typography: 'body2',
          }}
        />

        {mode === 'message' && (
          <>
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) sendFile(file, file.name);
                e.target.value = '';
              }}
            />
            <Tooltip title="Anexar arquivo">
              <span>
                <IconButton disabled={blocked || sending || recording} onClick={() => fileRef.current?.click()}>
                  <Iconify icon="eva:attach-2-fill" />
                </IconButton>
              </span>
            </Tooltip>
            {onOpenTemplate && (
              <Tooltip title="Enviar template aprovado (Meta)">
                <span>
                  <IconButton disabled={sending || recording} onClick={onOpenTemplate}>
                    <Iconify icon="solar:document-text-bold" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            <Tooltip title={recording ? 'Parar e enviar' : 'Gravar áudio'}>
              <span>
                <IconButton color={recording ? 'error' : 'default'} disabled={blocked || sending} onClick={toggleRecording}>
                  <Iconify icon={recording ? 'solar:stop-circle-bold' : 'solar:microphone-bold'} />
                </IconButton>
              </span>
            </Tooltip>
          </>
        )}

        <IconButton color="primary" disabled={blocked || sending || !text.trim()} onClick={send}>
          <Iconify icon="iconamoon:send-fill" />
        </IconButton>
      </Stack>
    </Box>
  );
}

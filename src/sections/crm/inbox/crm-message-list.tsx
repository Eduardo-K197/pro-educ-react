'use client';

import type { CrmMessage } from 'src/types/services/crm';

import { useRef, useState, useEffect, useLayoutEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';

import { Lightbox } from 'src/components/lightbox';

import { CrmMessageItem } from './crm-message-item';

import type { CrmMessageActions } from './crm-message-item';

// ----------------------------------------------------------------------

type Props = Omit<CrmMessageActions, 'onEdit'> & {
  /** Salva o novo texto de uma mensagem própria. */
  onEditText?: (message: CrmMessage, text: string) => Promise<void>;
  loading: boolean;
  messages: CrmMessage[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onReply: (message: CrmMessage) => void;
};

export function CrmMessageList({ loading, messages, hasMore, loadingMore, onLoadMore, onReply, onEditText, ...actions }: Props) {
  const [editing, setEditing] = useState<CrmMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const saveEdit = async () => {
    if (!editing || !onEditText || !editText.trim()) return;
    setSavingEdit(true);
    try {
      await onEditText(editing, editText.trim());
      setEditing(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const ref = useRef<HTMLDivElement>(null);
  const lastId = useRef<string | null>(null);
  const firstId = useRef<string | null>(null);
  const prevHeight = useRef(0);
  const [image, setImage] = useState<string | null>(null);

  // Rola para o fim quando chega mensagem nova (se já estava perto do fim);
  // ao carregar antigas, mantém a posição.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !messages.length) return;
    const newFirst = messages[0]?.id;
    const newLast = messages[messages.length - 1]?.id;
    if (firstId.current && newFirst !== firstId.current && newLast === lastId.current) {
      el.scrollTop = el.scrollHeight - prevHeight.current + el.scrollTop;
    } else if (newLast !== lastId.current) {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 240;
      if (nearBottom || !lastId.current) el.scrollTop = el.scrollHeight;
    }
    firstId.current = newFirst;
    lastId.current = newLast;
    prevHeight.current = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    lastId.current = null;
    firstId.current = null;
  }, [loading]);


  if (loading) {
    return (
      <Box sx={{ flex: '1 1 auto', position: 'relative' }}>
        <LinearProgress color="inherit" sx={{ position: 'absolute', top: 0, left: 0, width: 1, height: 2 }} />
      </Box>
    );
  }

  return (
    <>
      <Box
        ref={ref}
        onScroll={(e) => {
          prevHeight.current = (e.currentTarget as HTMLDivElement).scrollHeight;
        }}
        sx={{ px: 3, pt: 2, pb: 2, flex: '1 1 auto', overflowY: 'auto', minHeight: 0 }}
      >
        {hasMore && (
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Button size="small" onClick={onLoadMore} disabled={loadingMore}>
              {loadingMore ? 'Carregando...' : 'Carregar mensagens anteriores'}
            </Button>
          </Box>
        )}
        {messages.map((m) => (
          <CrmMessageItem
            key={m.id}
            message={m}
            onReply={onReply}
            onOpenImage={setImage}
            {...actions}
            onEdit={
              onEditText
                ? (msg) => {
                    setEditing(msg);
                    setEditText(msg.body ?? '');
                  }
                : undefined
            }
          />
        ))}
      </Box>
      <Lightbox slides={image ? [{ src: image }] : []} open={!!image} close={() => setImage(null)} index={0} />
      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>Editar mensagem</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            helperText="O WhatsApp permite editar até 15 minutos depois do envio."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancelar</Button>
          <Button variant="contained" disabled={savingEdit || !editText.trim() || editText.trim() === editing?.body} onClick={saveEdit}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

'use client';

import type { CrmAiKbDocument, CrmAiKbDocumentDetail } from 'src/types/services/crm-ai';

import { useState, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { CrmAiService } from 'src/services/crm-ai';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export type KbFormTarget = { kind: 'faq' | 'text' } | { document: CrmAiKbDocument };

type Props = {
  target: KbFormTarget | null;
  onClose: () => void;
  onSaved: () => void;
};

const FAQ_PLACEHOLDER = `Qual o horário da secretaria?
De segunda a sexta, das 7h às 18h.

A escola oferece período integral?
Sim, do 1º ao 5º ano, com almoço incluso.`;

/** Novo FAQ/texto ou edição de um documento da base de conhecimento. */
export function KbDocumentFormDialog({ target, onClose, onSaved }: Props) {
  const open = !!target;
  const editing = target && 'document' in target ? target.document : null;
  const kind = editing ? editing.kind : target && 'kind' in target ? target.kind : 'text';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [detail, setDetail] = useState<CrmAiKbDocumentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setDetail(null);
    if (!editing) {
      setTitle('');
      setContent('');
      return undefined;
    }
    let cancelled = false;
    setTitle(editing.title);
    setContent('');
    setLoading(true);
    CrmAiService.getDocument(editing.id)
      .then((d) => {
        if (cancelled) return;
        setDetail(d);
        setTitle(d.title);
        setContent(d.content ?? '');
      })
      .catch((err) => !cancelled && toast.error(err?.message || 'Erro ao carregar o documento'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, editing]);

  const isFile = kind === 'file';
  const valid = title.trim().length > 0 && (isFile || content.trim().length > 0);

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        const payload: { title?: string; content?: string } = {};
        if (title.trim() !== editing.title) payload.title = title.trim();
        // Conteúdo só vai quando mudou: o backend reindexa nesse caso.
        if (!isFile && detail && content !== detail.content) payload.content = content;
        if (Object.keys(payload).length) await CrmAiService.updateDocument(editing.id, payload);
        toast.success(payload.content !== undefined ? 'Documento salvo. A reindexação foi iniciada.' : 'Documento salvo');
      } else {
        await CrmAiService.createDocument({ title: title.trim(), kind: kind === 'faq' ? 'faq' : 'text', content });
        toast.success('Documento criado. A indexação foi iniciada.');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar o documento');
    } finally {
      setSaving(false);
    }
  };

  const heading = editing
    ? 'Editar documento'
    : kind === 'faq'
      ? 'Nova pergunta frequente (FAQ)'
      : 'Novo texto';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{heading}</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress sx={{ display: 'block', mx: 'auto', my: 6 }} />
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            {kind === 'faq' && (
              <Alert severity="info">
                Escreva a pergunta em uma linha e a resposta logo abaixo. Para cadastrar várias, separe cada par
                pergunta/resposta com uma linha em branco.
              </Alert>
            )}
            {isFile && (
              <Alert severity="info">
                Arquivo {editing?.fileName ? <strong>{editing.fileName}</strong> : ''}: o texto abaixo foi extraído
                automaticamente. Para trocar o conteúdo, envie um novo arquivo.
              </Alert>
            )}
            <TextField
              label="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={kind === 'faq' ? 'Ex.: Dúvidas da secretaria' : 'Ex.: Regras de matrícula 2027'}
              inputProps={{ maxLength: 200 }}
            />
            <TextField
              label={kind === 'faq' ? 'Perguntas e respostas' : 'Conteúdo'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={kind === 'faq' ? FAQ_PLACEHOLDER : 'Cole aqui o texto que a IA pode consultar.'}
              multiline
              minRows={10}
              maxRows={22}
              InputProps={{ readOnly: isFile }}
              helperText={`${content.length.toLocaleString('pt-BR')} caracteres`}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancelar
        </Button>
        <LoadingButton variant="contained" loading={saving} disabled={!valid || loading} onClick={save}>
          {editing ? 'Salvar' : 'Criar'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

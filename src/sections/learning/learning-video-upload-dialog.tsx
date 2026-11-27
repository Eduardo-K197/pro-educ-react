'use client';

import type { LearningLesson } from 'src/services/learning';

import { useRef, useState } from 'react';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';

import { tusUpload } from 'src/utils/tus-upload';

import { LearningVideoApi } from 'src/services/learning';

import { Iconify } from 'src/components/iconify';

import { fBytes } from './utils';

// ----------------------------------------------------------------------

type Props = { lesson: LearningLesson | null; onClose: () => void; onDone: () => void };

/** Envia o vídeo direto do navegador para o Bunny Stream (TUS); a API só assina. */
export function LearningVideoUploadDialog({ lesson, onClose, onDone }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const abort = useRef<AbortController | null>(null);

  const close = () => {
    abort.current?.abort();
    setFile(null);
    setProgress(null);
    setError('');
    onClose();
  };

  const send = async () => {
    if (!lesson || !file) return;
    setError('');
    setProgress(0);
    abort.current = new AbortController();
    try {
      const ticket = await LearningVideoApi.startUpload(lesson.id, lesson.title);
      await tusUpload({ file, ticket: ticket.upload, title: lesson.title, onProgress: setProgress, signal: abort.current.signal });
      onDone();
      close();
    } catch (err: any) {
      if (!abort.current?.signal.aborted) setError(err?.message || 'Falha no envio do vídeo.');
      setProgress(null);
    }
  };

  const sending = progress !== null;

  return (
    <Dialog open={!!lesson} onClose={sending ? undefined : close} fullWidth maxWidth="sm">
      <DialogTitle>Enviar vídeo</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            O vídeo vai direto para o servidor de vídeo da escola. Depois do envio ele é processado (alguns minutos) e só então aparece para
            os alunos. Substitui o vídeo atual da aula.
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Button component="label" variant="outlined" disabled={sending} startIcon={<Iconify icon="eva:video-fill" />}>
              Escolher vídeo
              <input hidden type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Button>
            <Typography variant="body2">{file ? `${file.name} (${fBytes(file.size)})` : 'Nenhum arquivo'}</Typography>
          </Stack>
          {sending && (
            <Stack spacing={0.5}>
              <LinearProgress variant="determinate" value={progress ?? 0} />
              <Typography variant="caption">{progress}% enviado — não feche esta janela.</Typography>
            </Stack>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>{sending ? 'Cancelar envio' : 'Fechar'}</Button>
        <LoadingButton variant="contained" loading={sending} disabled={!file} onClick={send}>
          Enviar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

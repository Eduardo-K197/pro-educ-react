'use client';

import type { LearningLesson, LearningMediaConfig } from 'src/services/learning';

import { useRef, useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { tusUpload } from 'src/utils/tus-upload';
import { putDirect, fileContentType, readVideoDuration } from 'src/utils/direct-upload';

import { LearningVideoApi } from 'src/services/learning';

import { Iconify } from 'src/components/iconify';

import { fBytes } from './utils';

// ----------------------------------------------------------------------

type Target = 'storage' | 'bunny';

type Props = {
  lesson: LearningLesson | null;
  config: LearningMediaConfig | null;
  onClose: () => void;
  onDone: (target: Target) => void;
};

const HELP: Record<Target, string> = {
  storage:
    'MP4 guardado no armazenamento da escola e tocado direto no navegador. Mais barato, sem adaptação de qualidade: ideal para aulas curtas.',
  bunny: 'Servidor de vídeo com qualidade adaptativa (bom para aulas longas e internet fraca). Leva alguns minutos para processar.',
};

/** Envio de vídeo próprio: MP4 no R2/S3 (PUT pré-assinado) ou Bunny Stream (TUS). A API só assina. */
export function LearningVideoUploadDialog({ lesson, config, onClose, onDone }: Props) {
  const options: Target[] = [...(config?.storage ? (['storage'] as const) : []), ...(config?.bunny ? (['bunny'] as const) : [])];
  const [target, setTarget] = useState<Target>(options[0] ?? 'storage');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (lesson) setTarget(config?.storage ? 'storage' : 'bunny');
  }, [lesson, config?.storage]);

  const close = () => {
    abort.current?.abort();
    setFile(null);
    setProgress(null);
    setError('');
    onClose();
  };

  const tooBig = target === 'storage' && !!file && !!config?.videoMaxBytes && file.size > config.videoMaxBytes;
  const notMp4 = target === 'storage' && !!file && !/\.mp4$/i.test(file.name);

  const send = async () => {
    if (!lesson || !file) return;
    setError('');
    setProgress(0);
    abort.current = new AbortController();
    try {
      if (target === 'storage') {
        const durationSec = await readVideoDuration(file);
        const contentType = fileContentType(file);
        const ticket = await LearningVideoApi.requestUpload(lesson.id, 'video', { fileName: file.name, contentType, size: file.size });
        await putDirect(ticket.uploadUrl, file, ticket.headers, setProgress, abort.current.signal);
        await LearningVideoApi.confirmUpload(lesson.id, 'video', { key: ticket.key, durationSec });
      } else {
        const ticket = await LearningVideoApi.startUpload(lesson.id, lesson.title);
        await tusUpload({ file, ticket: ticket.upload, title: lesson.title, onProgress: setProgress, signal: abort.current.signal });
      }
      onDone(target);
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
          {options.length > 1 && (
            <ToggleButtonGroup exclusive size="small" value={target} disabled={sending} onChange={(_, v) => v && setTarget(v)}>
              <ToggleButton value="storage">MP4 simples</ToggleButton>
              <ToggleButton value="bunny">Bunny Stream</ToggleButton>
            </ToggleButtonGroup>
          )}
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {HELP[target]} Substitui o vídeo atual da aula.
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Button component="label" variant="outlined" disabled={sending} startIcon={<Iconify icon="eva:video-fill" />}>
              Escolher vídeo
              <input
                hidden
                type="file"
                accept={target === 'storage' ? 'video/mp4,.mp4' : 'video/*'}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Button>
            <Typography variant="body2">{file ? `${file.name} (${fBytes(file.size)})` : 'Nenhum arquivo'}</Typography>
          </Stack>
          {notMp4 && <Alert severity="warning">Para esta opção, envie o vídeo em MP4.</Alert>}
          {tooBig && <Alert severity="warning">Arquivo maior que o limite de {fBytes(config?.videoMaxBytes)}.</Alert>}
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
        <LoadingButton variant="contained" loading={sending} disabled={!file || tooBig || notMp4} onClick={send}>
          Enviar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

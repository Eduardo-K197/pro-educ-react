'use client';

import type { LessonType, LessonInput, LearningLesson } from 'src/services/learning';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Editor } from 'src/components/editor';
import { Iconify } from 'src/components/iconify';

import { fBytes, LESSON_TYPE_LABEL } from './utils';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  lesson?: LearningLesson | null;
  onClose: () => void;
  /** Salva os dados; se houver arquivo, o chamador envia depois de criar/editar a aula. */
  onSubmit: (input: LessonInput, file: File | null) => Promise<void>;
};

export function LearningLessonDialog({ open, lesson, onClose, onSubmit }: Props) {
  const [type, setType] = useState<LessonType>('video');
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [body, setBody] = useState('');
  const [minutes, setMinutes] = useState('');
  const [required, setRequired] = useState(true);
  const [published, setPublished] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(lesson?.type ?? 'video');
    setTitle(lesson?.title ?? '');
    setVideoUrl(lesson?.videoUrl ?? '');
    setBody(lesson?.body ?? '');
    setMinutes(lesson?.durationSec ? String(Math.round(lesson.durationSec / 60)) : '');
    setRequired(lesson?.required ?? true);
    setPublished(lesson?.published ?? false);
    setFile(null);
  }, [open, lesson]);

  const hasFile = !!file || !!lesson?.file;
  const ownVideo = lesson?.videoProvider === 'bunny' || lesson?.videoProvider === 'storage';
  const canPublish =
    type === 'video' ? !!videoUrl.trim() || ownVideo : type === 'file' ? hasFile : !!body.replace(/<[^>]*>/g, '').trim();

  const submit = async () => {
    setSaving(true);
    try {
      const durationSec = minutes ? Math.max(0, Math.round(Number(minutes) * 60)) : null;
      await onSubmit(
        {
          type,
          title: title.trim(),
          body: body || null,
          // Aula com vídeo próprio: link vazio mantém o vídeo enviado; preencher troca por link externo.
          videoUrl: type === 'video' ? videoUrl.trim() || (ownVideo ? undefined : null) : lesson?.videoUrl ? null : undefined,
          durationSec,
          required,
          published: published && canPublish,
        },
        type === 'file' ? file : null
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{lesson ? 'Editar aula' : 'Nova aula'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="Tipo" value={type} onChange={(e) => setType(e.target.value as LessonType)} sx={{ minWidth: 160 }}>
              {(Object.keys(LESSON_TYPE_LABEL) as LessonType[]).map((t) => (
                <MenuItem key={t} value={t}>
                  {LESSON_TYPE_LABEL[t]}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} inputProps={{ maxLength: 200 }} fullWidth />
          </Stack>

          {type === 'video' && (
            <TextField
              label="Link do vídeo (YouTube ou Vimeo)"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              helperText={
                ownVideo
                  ? 'Esta aula usa vídeo próprio. Preencha só se quiser trocar por um link externo.'
                  : 'Use vídeos públicos ou não listados. Se a escola tiver vídeo próprio, salve a aula e use o botão de envio.'
              }
            />
          )}

          {type === 'file' && (
            <Box>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Button component="label" variant="outlined" startIcon={<Iconify icon="eva:cloud-upload-fill" />}>
                  {hasFile ? 'Trocar arquivo' : 'Escolher arquivo'}
                  <input hidden type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </Button>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {file ? `${file.name} (${fBytes(file.size)})` : lesson?.file ? `${lesson.file.name} ${fBytes(lesson.file.size)}` : 'Nenhum arquivo'}
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                PDF, apostila, planilha... O aluno baixa por um link temporário.
              </Typography>
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {type === 'text' ? 'Conteúdo da aula' : 'Texto de apoio (opcional)'}
            </Typography>
            <Editor value={body} onChange={setBody} placeholder="Escreva aqui..." sx={{ maxHeight: 420 }} />
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <TextField
              label="Duração (min)"
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              inputProps={{ min: 0, max: 1440 }}
              sx={{ width: 160 }}
            />
            <FormControlLabel control={<Switch checked={required} onChange={(e) => setRequired(e.target.checked)} />} label="Obrigatória" />
            <FormControlLabel
              control={<Switch checked={published && canPublish} disabled={!canPublish} onChange={(e) => setPublished(e.target.checked)} />}
              label="Publicada"
            />
          </Stack>
          {!canPublish && (
            <Alert severity="info">
              {type === 'video' ? 'Informe o link do vídeo (ou salve e envie o vídeo próprio) para publicar.' : type === 'file' ? 'Envie o arquivo para publicar.' : 'Escreva o conteúdo para publicar.'}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <LoadingButton variant="contained" loading={saving} disabled={!title.trim()} onClick={submit}>
          Salvar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

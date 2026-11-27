'use client';

import type { ModuleInput, LearningModule } from 'src/services/learning';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  module?: LearningModule | null;
  onClose: () => void;
  onSubmit: (input: ModuleInput) => Promise<void>;
};

export function LearningModuleDialog({ open, module, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(module?.title ?? '');
    setDescription(module?.description ?? '');
    setPublished(module?.published ?? false);
  }, [open, module]);

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim() || null, published });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{module ? 'Editar módulo' : 'Novo módulo'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} inputProps={{ maxLength: 200 }} autoFocus />
          <TextField
            label="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
          />
          <FormControlLabel
            control={<Switch checked={published} onChange={(e) => setPublished(e.target.checked)} />}
            label="Publicado (visível para os alunos)"
          />
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

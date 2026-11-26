'use client';

import type { CrmDepartment, CrmDepartmentPayload } from 'src/types/services/crm';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  current?: CrmDepartment | null;
  onClose: () => void;
  onSubmit: (payload: CrmDepartmentPayload) => Promise<void>;
};

export function CrmDepartmentFormDialog({ open, current, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(current?.name ?? '');
    setDescription(current?.description ?? '');
    setActive(current?.active ?? true);
    setTouched(false);
  }, [open, current]);

  const nameError = touched && name.trim().length < 2;

  const handleSubmit = async () => {
    setTouched(true);
    if (name.trim().length < 2) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || null, active });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{current ? 'Editar setor' : 'Novo setor'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            error={nameError}
            helperText={
              nameError ? 'Informe ao menos 2 caracteres' : 'Ex.: Secretaria, Financeiro, Comercial'
            }
            inputProps={{ maxLength: 80 }}
          />
          <TextField
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={2}
            inputProps={{ maxLength: 255 }}
          />
          <FormControlLabel
            control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />}
            label="Setor ativo"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancelar
        </Button>
        <LoadingButton variant="contained" loading={submitting} onClick={handleSubmit}>
          {current ? 'Salvar' : 'Criar setor'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

'use client';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// ----------------------------------------------------------------------

const COMMON_REASONS = [
  'Achou caro / sem condições financeiras',
  'Escolheu outra escola',
  'Sem vaga na série/turno desejado',
  'Mudou de cidade',
  'Não respondeu mais',
  'Distância / transporte',
];

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  title?: string;
};

/** Pede o motivo da perda (obrigatório ao mover para a etapa de perda). */
export function CrmDealLostDialog({ open, onClose, onConfirm, title = 'Marcar lead como perdido' }: Props) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const confirm = async () => {
    setSaving(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete
            freeSolo
            options={COMMON_REASONS}
            inputValue={reason}
            onInputChange={(_e, v) => setReason(v)}
            renderInput={(params) => <TextField {...params} autoFocus label="Motivo da perda *" inputProps={{ ...params.inputProps, maxLength: 255 }} />}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancelar
        </Button>
        <LoadingButton variant="contained" color="error" disabled={!reason.trim()} loading={saving} onClick={confirm}>
          Marcar como perdido
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

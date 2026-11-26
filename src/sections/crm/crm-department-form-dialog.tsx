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
import ToggleButton from '@mui/material/ToggleButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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
  const [greeting, setGreeting] = useState('');
  const [outOfHours, setOutOfHours] = useState('');
  const [useHours, setUseHours] = useState(false);
  const [days, setDays] = useState<string[]>(['1', '2', '3', '4', '5']);
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('18:00');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(current?.name ?? '');
    setDescription(current?.description ?? '');
    setActive(current?.active ?? true);
    setGreeting(current?.greetingMessage ?? '');
    setOutOfHours(current?.outOfHoursMessage ?? '');
    const hours = current?.businessHours;
    const configured = hours ? Object.keys(hours.days) : [];
    setUseHours(configured.length > 0);
    setDays(configured.length ? configured : ['1', '2', '3', '4', '5']);
    const firstRange = configured.length ? hours!.days[configured[0]][0] : null;
    setStart(firstRange?.[0] ?? '08:00');
    setEnd(firstRange?.[1] ?? '18:00');
    setTouched(false);
  }, [open, current]);

  const nameError = touched && name.trim().length < 2;

  const handleSubmit = async () => {
    setTouched(true);
    if (name.trim().length < 2) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        active,
        greetingMessage: greeting.trim() || null,
        outOfHoursMessage: outOfHours.trim() || null,
        businessHours:
          useHours && days.length && start < end
            ? { timezone: 'America/Sao_Paulo', days: Object.fromEntries(days.map((d) => [d, [[start, end]]])) }
            : null,
      });
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
          <TextField
            label="Saudação do setor (opcional)"
            helperText="Enviada quando uma conversa nova cai neste setor. Use {{nome}}, {{protocolo}}, {{setor}}."
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            multiline
            minRows={2}
          />
          <FormControlLabel
            control={<Switch checked={useHours} onChange={(e) => setUseHours(e.target.checked)} />}
            label="Definir horário de atendimento"
          />
          {useHours && (
            <>
              <ToggleButtonGroup size="small" value={days} onChange={(_e, v) => setDays(v)}>
                {WEEKDAYS.map((d, i) => (
                  <ToggleButton key={d} value={String(i)}>
                    {d}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Stack direction="row" spacing={2}>
                <TextField type="time" label="Início" value={start} onChange={(e) => setStart(e.target.value)} InputLabelProps={{ shrink: true }} />
                <TextField type="time" label="Fim" value={end} onChange={(e) => setEnd(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Stack>
              <TextField
                label="Mensagem fora do horário"
                value={outOfHours}
                onChange={(e) => setOutOfHours(e.target.value)}
                multiline
                minRows={2}
              />
            </>
          )}
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

'use client';

import type {
  CrmRole,
  CrmMember,
  CrmCandidate,
  CrmDepartment,
  CrmMemberCreatePayload,
  CrmMemberUpdatePayload,
} from 'src/types/services/crm';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { CRM_ROLE_LABELS, CRM_USER_TYPE_LABELS } from 'src/types/services/crm';

// ----------------------------------------------------------------------

const ROLE_HELP: Record<CrmRole, string> = {
  agente: 'Atende as conversas dos seus setores.',
  supervisor: 'Acompanha e redistribui as conversas da equipe.',
  gestor: 'Configura setores, membros e canais.',
};

type Props = {
  open: boolean;
  current?: CrmMember | null;
  candidates: CrmCandidate[];
  departments: CrmDepartment[];
  onClose: () => void;
  onCreate: (payload: CrmMemberCreatePayload) => Promise<void>;
  onUpdate: (id: string, payload: CrmMemberUpdatePayload) => Promise<void>;
};

export function CrmMemberFormDialog({
  open,
  current,
  candidates,
  departments,
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const [user, setUser] = useState<CrmCandidate | null>(null);
  const [role, setRole] = useState<CrmRole>('agente');
  const [active, setActive] = useState(true);
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUser(null);
    setRole(current?.role ?? 'agente');
    setActive(current?.active ?? true);
    setDepartmentIds(current?.departments.map((d) => d.id) ?? []);
    setTouched(false);
  }, [open, current]);

  const selectedDepartments = departments.filter((d) => departmentIds.includes(d.id));
  const userError = touched && !current && !user;

  const handleSubmit = async () => {
    setTouched(true);
    if (!current && !user) return;
    setSubmitting(true);
    try {
      if (current) {
        await onUpdate(current.id, { role, active, departmentIds });
      } else if (user) {
        await onCreate({
          userType: user.userType,
          userId: user.userId,
          role,
          active,
          departmentIds,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{current ? 'Editar membro' : 'Adicionar membro'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {current ? (
            <TextField
              label="Usuário"
              value={`${current.name ?? 'Usuário removido'} (${CRM_USER_TYPE_LABELS[current.userType]})`}
              disabled
            />
          ) : (
            <Autocomplete
              options={candidates}
              value={user}
              onChange={(_e, value) => setUser(value)}
              groupBy={(option) => CRM_USER_TYPE_LABELS[option.userType]}
              getOptionLabel={(option) =>
                option.email ? `${option.name} — ${option.email}` : option.name
              }
              isOptionEqualToValue={(a, b) => a.userId === b.userId && a.userType === b.userType}
              noOptionsText="Todos os usuários da escola já são membros"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Usuário"
                  error={userError}
                  helperText={
                    userError
                      ? 'Selecione um usuário'
                      : 'Administradores, funcionários e professores da escola'
                  }
                />
              )}
            />
          )}

          <TextField
            select
            label="Papel no CRM"
            value={role}
            onChange={(e) => setRole(e.target.value as CrmRole)}
            helperText={ROLE_HELP[role]}
          >
            {(Object.keys(CRM_ROLE_LABELS) as CrmRole[]).map((r) => (
              <MenuItem key={r} value={r}>
                {CRM_ROLE_LABELS[r]}
              </MenuItem>
            ))}
          </TextField>

          <Autocomplete
            multiple
            options={departments}
            value={selectedDepartments}
            onChange={(_e, value) => setDepartmentIds(value.map((d) => d.id))}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText="Nenhum setor cadastrado"
            renderInput={(params) => <TextField {...params} label="Setores" />}
          />

          <FormControlLabel
            control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />}
            label="Membro ativo"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancelar
        </Button>
        <LoadingButton variant="contained" loading={submitting} onClick={handleSubmit}>
          {current ? 'Salvar' : 'Adicionar'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

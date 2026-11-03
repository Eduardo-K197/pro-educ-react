'use client';

import type { EmployeeItem } from 'src/services/employee';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { SchoolService } from 'src/services/school';
import { EmployeeService } from 'src/services/employee';

import { toast } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useAuthContext } from 'src/auth/hooks';

export function SchoolEmployees({
  schoolId,
  employees,
  onRefresh,
}: {
  schoolId: string;
  employees: { id: string; name?: string; email?: string }[];
  onRefresh: () => void;
}) {
  const { user } = useAuthContext();
  const canManage = ['admin', 'superAdmin'].includes(user?.role);
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState('existing');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState<{ id: string; name?: string; email?: string } | null>(null);
  useEffect(() => {
    if (!open) {
      setPassword('');
      setConfirmation('');
      return undefined;
    }
    let active = true;
    setLoading(true);
    setError(false);
    setEmployeeId('');
    EmployeeService.list()
      .then((response) => {
        if (active) setAll(response.employees);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, schoolId]);
  const save = async () => {
    if (!canManage || saving) return;
    if (
      mode === 'new' &&
      (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        password.trim().length < 8 ||
        password !== confirmation)
    ) {
      toast.error('Informe e-mail válido e senhas iguais, com ao menos 8 caracteres.');
      return;
    }
    if (
      mode === 'existing' &&
      (!employeeId || error || loading || !all.some((employee) => employee.id === employeeId))
    )
      return;
    setSaving(true);
    try {
      if (mode === 'new') await EmployeeService.create(email.trim(), password, schoolId);
      else await SchoolService.addEmployee(schoolId, employeeId);
      setOpen(false);
      setPassword('');
      setConfirmation('');
      setEmail('');
      onRefresh();
      toast.success('Funcionário vinculado à escola.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Não foi possível salvar o funcionário.');
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!target || saving || !canManage) return;
    setSaving(true);
    try {
      await SchoolService.removeEmployee(schoolId, target.id);
      setTarget(null);
      onRefresh();
      toast.success('Acesso à escola removido.');
    } catch {
      toast.error('Não foi possível remover o vínculo.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="overline" color="text.secondary">
          Funcionários
        </Typography>
        {canManage && (
          <Button size="small" onClick={() => setOpen(true)}>
            Adicionar funcionário
          </Button>
        )}
      </Stack>
      {!employees.length && (
        <Typography variant="body2" color="text.secondary">
          Nenhum funcionário vinculado.
        </Typography>
      )}
      {employees.map((employee) => (
        <Stack key={employee.id} direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2">
            {employee.name || employee.email || 'Funcionário'}
          </Typography>
          {canManage && (
            <Button size="small" color="error" onClick={() => setTarget(employee)}>
              Remover acesso
            </Button>
          )}
        </Stack>
      ))}
      <Dialog
        open={open}
        onClose={() => {
          if (!saving) setOpen(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Adicionar funcionário à escola</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label="Forma de inclusão"
              value={mode}
              disabled={saving}
              onChange={(event) => setMode(event.target.value)}
            >
              <MenuItem value="existing">Vincular funcionário existente</MenuItem>
              <MenuItem value="new">Criar funcionário</MenuItem>
            </TextField>
            {mode === 'existing' ? (
              <>
                {error && (
                  <Alert severity="error">
                    Não foi possível carregar funcionários. Feche e abra a janela para tentar
                    novamente.
                  </Alert>
                )}
                <TextField
                  select
                  label="Funcionário"
                  value={employeeId}
                  disabled={loading || saving || error}
                  onChange={(event) => setEmployeeId(event.target.value)}
                >
                  <MenuItem value="">Selecione o funcionário</MenuItem>
                  {all
                    .filter((employee) => !employees.some((linked) => linked.id === employee.id))
                    .map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name || employee.email}
                      </MenuItem>
                    ))}
                </TextField>
              </>
            ) : (
              <>
                <TextField
                  label="E-mail do funcionário"
                  type="email"
                  value={email}
                  disabled={saving}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="off"
                />
                <TextField
                  label="Senha inicial"
                  type="password"
                  value={password}
                  disabled={saving}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  helperText="Ao menos 8 caracteres. Não compartilhe a senha em telas ou relatórios."
                />
                <TextField
                  label="Confirmar senha inicial"
                  type="password"
                  value={confirmation}
                  disabled={saving}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="new-password"
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <LoadingButton
            loading={saving}
            variant="contained"
            onClick={save}
            disabled={mode === 'existing' && (!employeeId || loading || error)}
          >
            Salvar funcionário
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={!!target}
        onClose={() => {
          if (!saving) setTarget(null);
        }}
        title="Remover acesso à escola"
        content={`Remover o acesso de ${target?.name || target?.email || 'este funcionário'} somente a esta escola? A conta e os vínculos com outras escolas serão preservados.`}
        action={
          <LoadingButton color="error" variant="contained" loading={saving} onClick={remove}>
            Confirmar remoção
          </LoadingButton>
        }
      />
    </Stack>
  );
}

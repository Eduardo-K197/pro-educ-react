'use client';

import type { AccessLink, StudentAccess } from 'src/services/learning';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { useSchoolModules } from 'src/hooks/use-school-modules';

import { fDateTime } from 'src/utils/format-time';

import { accessLinkUrl, LearningService } from 'src/services/learning';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

type Target = 'student' | 'guardian';

/**
 * Ficha do aluno → acesso à área do aluno (ProEduc Learning). A escola gera um
 * link de uso único (72 h) e copia/envia para o aluno ou o responsável.
 */
export function StudentLearningAccessCard({ studentId }: { studentId: number | string }) {
  const { modules } = useSchoolModules();
  const { user } = useAuthContext();
  const role = user?.role;
  const allowed = role === 'admin' || role === 'superAdmin' || role === 'employee';

  const [access, setAccess] = useState<StudentAccess | null>(null);
  const [inviteTarget, setInviteTarget] = useState<Target | null>(null);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [link, setLink] = useState<{ title: string; data: AccessLink } | null>(null);

  const load = useCallback(() => {
    LearningService.studentAccess(studentId)
      .then(setAccess)
      .catch(() => setAccess(null));
  }, [studentId]);

  useEffect(() => {
    if (modules.learning && allowed) load();
  }, [modules.learning, allowed, load]);

  if (!modules.learning || !allowed || !access) return null;

  const openInvite = (target: Target) => {
    setEmail((target === 'guardian' ? access.student.guardianEmail : access.student.email) ?? '');
    setInviteTarget(target);
  };

  const sendInvite = async () => {
    if (!inviteTarget) return;
    setSaving(true);
    try {
      const data = await LearningService.invite(studentId, { target: inviteTarget, email: email.trim() || undefined });
      setInviteTarget(null);
      setLink({ title: 'Link de convite gerado', data });
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível gerar o convite');
    } finally {
      setSaving(false);
    }
  };

  const resetLink = async (accountId: string) => {
    try {
      const data = await LearningService.resetLink(studentId, accountId);
      setLink({ title: 'Link de redefinição de senha', data });
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível gerar o link');
    }
  };

  const revoke = async (linkId: string) => {
    try {
      await LearningService.revoke(studentId, linkId);
      toast.success('Acesso revogado');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível revogar');
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copiado');
    } catch {
      toast.error('Copie o link manualmente');
    }
  };

  const active = access.accounts.filter((a) => !a.revokedAt);

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        <Stack sx={{ flex: 1 }}>
          <Typography variant="h6">Área do aluno (ProEduc Learning)</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Gere um link de acesso de uso único (vale 72 h) e envie ao aluno ou ao responsável.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => openInvite('student')}>
            Convidar aluno
          </Button>
          <Button size="small" variant="outlined" onClick={() => openInvite('guardian')}>
            Convidar responsável
          </Button>
        </Stack>
      </Stack>

      {!active.length && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Nenhum acesso liberado ainda.
        </Typography>
      )}

      <Stack spacing={1}>
        {active.map((a) => (
          <Stack key={a.linkId} direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Iconify icon={a.relation === 'guardian' ? 'solar:users-group-two-rounded-bold' : 'solar:user-bold'} />
            <Typography variant="body2" sx={{ flex: 1, minWidth: 180, overflowWrap: 'anywhere' }}>
              {a.email}
            </Typography>
            <Label color={a.relation === 'guardian' ? 'info' : 'primary'}>{a.relation === 'guardian' ? 'Responsável' : 'Aluno'}</Label>
            <Label color={a.hasPassword ? 'success' : 'warning'}>{a.hasPassword ? 'Ativo' : 'Convite pendente'}</Label>
            {a.hasPassword && (
              <Tooltip title="Gerar link para redefinir a senha">
                <IconButton size="small" onClick={() => resetLink(a.accountId)}>
                  <Iconify icon="solar:key-bold" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Revogar acesso">
              <IconButton size="small" color="error" onClick={() => revoke(a.linkId)}>
                <Iconify icon="solar:forbidden-circle-bold" />
              </IconButton>
            </Tooltip>
          </Stack>
        ))}
      </Stack>

      <Dialog open={!!inviteTarget} onClose={() => setInviteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>{inviteTarget === 'guardian' ? 'Convidar responsável' : 'Convidar aluno'}</DialogTitle>
        <DialogContent>
          <TextField
            label="E-mail de acesso"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
            helperText="Será o login na área do aluno."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteTarget(null)}>Cancelar</Button>
          <LoadingButton variant="contained" loading={saving} disabled={!email.trim()} onClick={sendInvite}>
            Gerar link
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={!!link} onClose={() => setLink(null)} fullWidth maxWidth="sm">
        <DialogTitle>{link?.title}</DialogTitle>
        <DialogContent>
          {link && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Alert severity="warning">
                Este link aparece só agora e funciona uma única vez até {fDateTime(link.data.expiresAt, 'DD/MM/YYYY HH:mm')}. Envie somente para{' '}
                <strong>{link.data.email}</strong>.
              </Alert>
              {link.data.accountExists && (
                <Alert severity="info">Este e-mail já tem acesso: ao abrir o link, a pessoa confirma com a senha atual.</Alert>
              )}
              <TextField value={accessLinkUrl(link.data)} fullWidth InputProps={{ readOnly: true }} onFocus={(e) => e.target.select()} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLink(null)}>Fechar</Button>
          <Button variant="contained" startIcon={<Iconify icon="solar:copy-bold" />} onClick={() => link && copy(accessLinkUrl(link.data))}>
            Copiar link
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

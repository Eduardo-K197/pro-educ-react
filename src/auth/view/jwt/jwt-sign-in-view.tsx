'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import { useRouter, useSearchParams } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { useBoolean } from 'src/hooks/use-boolean';

import axios, { STORAGE_KEYS } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from '../../hooks';
import { FormHead } from '../../components/form-head';
import { signInWithPassword } from '../../context/jwt';

// ----------------------------------------------------------------------

const SignInSchema = zod.object({
  email: zod
    .string()
    .min(1, { message: 'E-mail é obrigatório!' })
    .email({ message: 'Informe um e-mail válido!' }),
  password: zod
    .string()
    .min(1, { message: 'Senha é obrigatória!' })
    .min(6, { message: 'A senha deve ter pelo menos 6 caracteres!' }),
});
type SignInSchemaType = zod.infer<typeof SignInSchema>;

function stripHtml(s: string) {
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = decodeURIComponent(searchParams?.get('returnTo') ?? CONFIG.auth.redirectPath);

  const { checkUserSession } = useAuthContext();
  const [errorMsg, setErrorMsg] = useState('');
  const password = useBoolean();

  // modal de primeiro login
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const showNewPassword = useBoolean();

  const methods = useForm<SignInSchemaType>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: '', password: '' },
  });

  const {
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setErrorMsg('');
    try {
      const { mustChangePassword } = await signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (mustChangePassword) {
        setValue('password', '');
        setNewPassword('');
        setChangePasswordError('');
        setChangePasswordOpen(true);
      } else {
        await checkUserSession?.();
        router.push(returnTo || CONFIG.auth.redirectPath);
      }
    } catch (err: any) {
      const raw = err?.message || String(err);
      setErrorMsg(raw.startsWith('<') ? stripHtml(raw).slice(0, 240) : raw);
    }
  });

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setChangePasswordError('A senha deve ter pelo menos 8 caracteres');
      return;
    }
    setChangePasswordError('');
    setChangingPassword(true);
    try {
      await axios.put('/teachers/change-password-first-login', { newPassword });
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEYS.mustChangePassword);
      }
      setChangePasswordOpen(false);
      await checkUserSession?.();
      router.push(returnTo || CONFIG.auth.redirectPath);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Erro ao alterar senha.';
      setChangePasswordError(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      <FormHead
        title="Entrar na sua conta"
        description={
          <>
            {'Não tem uma conta? '}
            <Link component={RouterLink} href={paths.auth.jwt.signUp} variant="subtitle2">
              Comece aqui
            </Link>
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        <Box gap={3} display="flex" flexDirection="column">
          <Field.Text name="email" label="Endereço de e-mail" InputLabelProps={{ shrink: true }} />
          <Box gap={1.5} display="flex" flexDirection="column">
            <Link
              component={RouterLink}
              href="#"
              variant="body2"
              color="inherit"
              sx={{ alignSelf: 'flex-end' }}
            >
              Esqueceu a senha?
            </Link>
            <Field.Text
              name="password"
              label="Senha"
              placeholder="6+ caracteres"
              type={password.value ? 'text' : 'password'}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={password.onToggle} edge="end">
                      <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <LoadingButton
            fullWidth
            color="inherit"
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            loadingIndicator="Entrando..."
          >
            Entrar
          </LoadingButton>
        </Box>
      </Form>

      {/* Modal de primeiro acesso */}
      <Dialog
        open={changePasswordOpen}
        maxWidth="xs"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
      >
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Stack spacing={0.5}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'primary.lighter',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Iconify icon="solar:lock-password-bold-duotone" width={22} color="primary.main" />
                </Box>
                <Typography variant="h6">Crie sua senha</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Primeiro acesso detectado. Defina uma senha pessoal para continuar.
              </Typography>
            </Stack>

            <TextField
              fullWidth
              label="Nova senha"
              placeholder="Mínimo 8 caracteres"
              autoFocus
              type={showNewPassword.value ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (changePasswordError) setChangePasswordError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleChangePassword();
              }}
              error={!!changePasswordError}
              helperText={changePasswordError || ' '}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={showNewPassword.onToggle} edge="end">
                      <Iconify
                        icon={showNewPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <LoadingButton
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              loading={changingPassword}
              loadingIndicator="Salvando..."
              onClick={handleChangePassword}
            >
              Salvar e entrar
            </LoadingButton>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

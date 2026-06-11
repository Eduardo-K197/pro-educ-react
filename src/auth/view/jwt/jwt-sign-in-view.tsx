'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from '../../hooks';
import { FormHead } from '../../components/form-head';
import { signInWithPassword } from '../../context/jwt';

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

export function JwtSignInView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = decodeURIComponent(searchParams?.get('returnTo') ?? '/proeduc');

  const { checkUserSession } = useAuthContext();
  const [errorMsg, setErrorMsg] = useState('');
  const password = useBoolean();

  const methods = useForm<SignInSchemaType>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: '', password: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setErrorMsg('');
    try {
      const { mustChangePassword } = await signInWithPassword({
        email: data.email,
        password: data.password,
      });
      await checkUserSession?.();
      if (mustChangePassword) {
        router.push(paths.auth.jwt.changePassword);
      } else {
        router.push(returnTo || '/proeduc');
      }
    } catch (err: any) {
      const raw = err?.message || String(err);
      setErrorMsg(raw.startsWith('<') ? stripHtml(raw).slice(0, 240) : raw);
    }
  });

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
    </>
  );
}

'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import axios, { STORAGE_KEYS } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from '../../hooks';
import { FormHead } from '../../components/form-head';

const Schema = zod
  .object({
    newPassword: zod
      .string()
      .min(8, { message: 'A senha deve ter pelo menos 8 caracteres!' })
      .max(72, { message: 'Senha muito longa!' }),
    confirmPassword: zod.string().min(1, { message: 'Confirme a senha!' }),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'As senhas não coincidem!',
    path: ['confirmPassword'],
  });

type SchemaType = zod.infer<typeof Schema>;

export function JwtChangePasswordView() {
  const router = useRouter();
  const { checkUserSession } = useAuthContext();
  const [errorMsg, setErrorMsg] = useState('');
  const showNew = useBoolean();
  const showConfirm = useBoolean();

  const methods = useForm<SchemaType>({
    resolver: zodResolver(Schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setErrorMsg('');
    try {
      await axios.put('/teachers/change-password-first-login', {
        newPassword: data.newPassword,
      });

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEYS.mustChangePassword);
      }

      await checkUserSession?.();
      router.push(paths.dashboard.root);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Erro ao alterar senha.';
      setErrorMsg(msg);
    }
  });

  return (
    <>
      <FormHead
        title="Crie sua senha"
        description={
          <Typography variant="body2" color="text.secondary">
            Este é seu primeiro acesso. Defina uma nova senha para continuar.
          </Typography>
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
          <Field.Text
            name="newPassword"
            label="Nova senha"
            placeholder="Mínimo 8 caracteres"
            type={showNew.value ? 'text' : 'password'}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showNew.onToggle} edge="end">
                    <Iconify icon={showNew.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Field.Text
            name="confirmPassword"
            label="Confirmar senha"
            placeholder="Repita a nova senha"
            type={showConfirm.value ? 'text' : 'password'}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showConfirm.onToggle} edge="end">
                    <Iconify
                      icon={showConfirm.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <LoadingButton
            fullWidth
            color="primary"
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            loadingIndicator="Salvando..."
          >
            Salvar senha e entrar
          </LoadingButton>
        </Box>
      </Form>
    </>
  );
}

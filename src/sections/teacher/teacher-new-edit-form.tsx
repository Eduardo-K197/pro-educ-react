'use client';

import type { TeacherDetail, TeacherCreatePayload } from 'src/types/services/teacher';

import { z as zod } from 'zod';
import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { TeacherService } from 'src/services/teacher';

// ----------------------------------------------------------------------

const TeacherSchema = zod.object({
  name: zod.string().min(2, 'Nome obrigatório'),
  email: zod.string().email('E-mail inválido'),
  phoneNumber: zod.string().min(1, 'Telefone obrigatório'),
  password: zod.string().min(6, 'Senha mínima 6 caracteres').optional().or(zod.literal('')),
  birthDate: zod.string().optional(),
  hourlyProfit: zod.coerce.number().min(0).optional(),
});

type TeacherFormValues = zod.infer<typeof TeacherSchema>;

type Props = { currentTeacher?: TeacherDetail };

export function TeacherNewEditForm({ currentTeacher }: Props) {
  const router = useRouter();
  const isEdit = !!currentTeacher;

  const defaultValues = useMemo<TeacherFormValues>(
    () => ({
      name: currentTeacher?.name ?? '',
      email: currentTeacher?.email ?? '',
      phoneNumber: currentTeacher?.phoneNumber ?? '',
      password: '',
      birthDate: currentTeacher?.birthDate ? currentTeacher.birthDate.substring(0, 10) : '',
      hourlyProfit: currentTeacher?.hourlyProfit ?? 0,
    }),
    [currentTeacher]
  );

  const methods = useForm<TeacherFormValues>({ resolver: zodResolver(TeacherSchema), defaultValues });
  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  useEffect(() => {
    if (currentTeacher) reset(defaultValues);
  }, [currentTeacher, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEdit && currentTeacher) {
        await TeacherService.update(currentTeacher.id, {
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
          birthDate: data.birthDate || undefined,
          hourlyProfit: data.hourlyProfit,
          password: data.password || undefined,
        });
        toast.success('Professor atualizado!');
      } else {
        const payload: TeacherCreatePayload = {
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
          birthDate: data.birthDate || undefined,
          hourlyProfit: data.hourlyProfit,
          password: data.password || undefined,
        };
        await TeacherService.create(payload);
        toast.success('Professor criado!');
      }
      router.push(paths.dashboard.teachers.root);
    } catch (error: any) {
      toast.error(error?.message ?? 'Erro ao salvar professor');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Dados do professor</Typography>
            <Stack spacing={2.5}>
              <Field.Text name="name" label="Nome completo *" />

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Field.Text name="email" label="E-mail *" type="email" />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Field.Text name="phoneNumber" label="Telefone *" />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Field.Text name="birthDate" label="Data de nascimento" type="date" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Field.Text name="hourlyProfit" label="Valor hora/aula (R$)" type="number" />
                </Grid>
              </Grid>

              <Field.Text
                name="password"
                label={isEdit ? 'Nova senha (deixe em branco para não alterar)' : 'Senha inicial (opcional)'}
                type="password"
              />
            </Stack>
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <LoadingButton fullWidth type="submit" variant="contained" color="primary" loading={isSubmitting}>
                {isEdit ? 'Salvar alterações' : 'Criar professor'}
              </LoadingButton>
              <Button fullWidth variant="outlined" color="inherit" onClick={() => router.push(paths.dashboard.teachers.root)}>
                Cancelar
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}

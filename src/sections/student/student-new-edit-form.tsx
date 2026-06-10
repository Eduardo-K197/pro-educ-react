'use client';

import type { StudentDetail, StudentCreatePayload } from 'src/types/services/student';

import { z as zod } from 'zod';
import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { StudentService } from 'src/services/student';

// ----------------------------------------------------------------------

const StudentSchema = zod.object({
  name: zod.string().min(2, 'Nome obrigatório'),
  email: zod.string().email('E-mail inválido').optional().or(zod.literal('')),
  phone: zod.string().optional(),
  birthDate: zod.string().optional(),
  gender: zod.string().optional(),
  cpf: zod.string().optional(),
  rg: zod.string().optional(),
  address: zod.string().optional(),
  status: zod.string().optional(),
  guardianName: zod.string().optional(),
  guardianPhone: zod.string().optional(),
  guardianEmail: zod.string().optional(),
  guardianRelationship: zod.string().optional(),
});

type StudentFormValues = zod.infer<typeof StudentSchema>;

type Props = {
  currentStudent?: StudentDetail;
};

export function StudentNewEditForm({ currentStudent }: Props) {
  const router = useRouter();
  const isEdit = !!currentStudent;

  const defaultValues = useMemo<StudentFormValues>(
    () => ({
      name: currentStudent?.name ?? '',
      email: currentStudent?.email ?? '',
      phone: currentStudent?.phone ?? '',
      birthDate: currentStudent?.birthDate
        ? currentStudent.birthDate.substring(0, 10)
        : '',
      gender: currentStudent?.gender ?? '',
      cpf: currentStudent?.cpf ?? '',
      rg: currentStudent?.rg ?? '',
      address: currentStudent?.address ?? '',
      status: currentStudent?.status ?? 'active',
      guardianName: currentStudent?.guardian?.name ?? '',
      guardianPhone: currentStudent?.guardian?.phone ?? '',
      guardianEmail: currentStudent?.guardian?.email ?? '',
      guardianRelationship: currentStudent?.guardian?.relationship ?? '',
    }),
    [currentStudent]
  );

  const methods = useForm<StudentFormValues>({
    resolver: zodResolver(StudentSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (currentStudent) reset(defaultValues);
  }, [currentStudent, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload: StudentCreatePayload = {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        birthDate: data.birthDate || undefined,
        gender: data.gender || undefined,
        cpf: data.cpf || undefined,
        rg: data.rg || undefined,
        address: data.address || undefined,
        status: data.status || 'active',
        guardian:
          data.guardianName
            ? {
                name: data.guardianName,
                phone: data.guardianPhone || undefined,
                email: data.guardianEmail || undefined,
                relationship: data.guardianRelationship || undefined,
              }
            : undefined,
      };

      if (isEdit && currentStudent) {
        await StudentService.update(currentStudent.id, payload);
        toast.success('Aluno atualizado com sucesso!');
      } else {
        await StudentService.create(payload);
        toast.success('Aluno criado com sucesso!');
      }

      router.push(paths.dashboard.students.root);
    } catch (error: any) {
      toast.error(error?.message ?? 'Erro ao salvar aluno');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Dados pessoais
            </Typography>

            <Stack spacing={2}>
              <Field.Text name="name" label="Nome completo *" />

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Field.Text name="email" label="E-mail" type="email" />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Field.Text name="phone" label="Telefone" />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Field.Text name="birthDate" label="Data de nascimento" type="date" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Field.Select name="gender" label="Gênero">
                    <MenuItem value="">Selecione</MenuItem>
                    <MenuItem value="male">Masculino</MenuItem>
                    <MenuItem value="female">Feminino</MenuItem>
                    <MenuItem value="other">Outro</MenuItem>
                  </Field.Select>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Field.Text name="cpf" label="CPF" />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Field.Text name="rg" label="RG" />
                </Grid>
              </Grid>

              <Field.Text name="address" label="Endereço" multiline rows={2} />
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 3 }}>
              Responsável
            </Typography>

            <Stack spacing={2}>
              <Field.Text name="guardianName" label="Nome do responsável" />

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Field.Text name="guardianPhone" label="Telefone do responsável" />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Field.Text name="guardianEmail" label="E-mail do responsável" />
                </Grid>
              </Grid>

              <Field.Select name="guardianRelationship" label="Parentesco">
                <MenuItem value="">Selecione</MenuItem>
                <MenuItem value="father">Pai</MenuItem>
                <MenuItem value="mother">Mãe</MenuItem>
                <MenuItem value="guardian">Responsável</MenuItem>
                <MenuItem value="other">Outro</MenuItem>
              </Field.Select>
            </Stack>
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Status
            </Typography>

            <Field.Select name="status" label="Status do aluno">
              <MenuItem value="active">Ativo</MenuItem>
              <MenuItem value="inactive">Inativo</MenuItem>
              <MenuItem value="suspended">Suspenso</MenuItem>
            </Field.Select>

            <Stack spacing={1.5} sx={{ mt: 3 }}>
              <LoadingButton
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                loading={isSubmitting}
              >
                {isEdit ? 'Salvar alterações' : 'Criar aluno'}
              </LoadingButton>
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                onClick={() => router.push(paths.dashboard.students.root)}
              >
                Cancelar
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}

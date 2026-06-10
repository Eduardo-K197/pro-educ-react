'use client';

import type { CourseDetail, CourseCreatePayload } from 'src/types/services/course';

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
import { CourseService } from 'src/services/course';

const CourseSchema = zod.object({
  name: zod.string().min(2, 'Nome obrigatório'),
  description: zod.string().optional(),
  workload: zod.coerce.number().min(0).optional(),
});

type CourseFormValues = zod.infer<typeof CourseSchema>;

type Props = { currentCourse?: CourseDetail };

export function CourseNewEditForm({ currentCourse }: Props) {
  const router = useRouter();
  const isEdit = !!currentCourse;

  const defaultValues = useMemo<CourseFormValues>(
    () => ({
      name: currentCourse?.name ?? '',
      description: currentCourse?.description ?? '',
      workload: currentCourse?.workload ?? 0,
    }),
    [currentCourse]
  );

  const methods = useForm<CourseFormValues>({ resolver: zodResolver(CourseSchema), defaultValues });
  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  useEffect(() => { if (currentCourse) reset(defaultValues); }, [currentCourse, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload: CourseCreatePayload = {
        name: data.name,
        description: data.description || undefined,
        workload: data.workload,
      };
      if (isEdit && currentCourse) {
        await CourseService.update(currentCourse.id, payload);
        toast.success('Curso atualizado!');
      } else {
        await CourseService.create(payload);
        toast.success('Curso criado!');
      }
      router.push(paths.dashboard.courses.root);
    } catch (error: any) {
      toast.error(error?.message ?? 'Erro ao salvar curso');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Dados do curso</Typography>
            <Stack spacing={2}>
              <Field.Text name="name" label="Nome do curso *" />
              <Field.Text name="description" label="Descrição" multiline rows={3} />
              <Field.Text name="workload" label="Carga horária (horas)" type="number" />
            </Stack>
          </Card>
        </Grid>
        <Grid xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <LoadingButton fullWidth type="submit" variant="contained" color="primary" loading={isSubmitting}>
                {isEdit ? 'Salvar alterações' : 'Criar curso'}
              </LoadingButton>
              <Button fullWidth variant="outlined" color="inherit" onClick={() => router.push(paths.dashboard.courses.root)}>
                Cancelar
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}

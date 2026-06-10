'use client';

import type { ClassroomDetail, ClassroomCreatePayload } from 'src/types/services/classroom';
import type { CourseListItem } from 'src/types/services/course';

import { z as zod } from 'zod';
import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { ClassroomService } from 'src/services/classroom';
import { CourseService } from 'src/services/course';

const ClassroomSchema = zod.object({
  name: zod.string().min(2, 'Nome obrigatório'),
  courseId: zod.string().optional(),
});

type ClassroomFormValues = zod.infer<typeof ClassroomSchema>;

type Props = { currentClassroom?: ClassroomDetail };

export function ClassroomNewEditForm({ currentClassroom }: Props) {
  const router = useRouter();
  const isEdit = !!currentClassroom;
  const [courses, setCourses] = useState<CourseListItem[]>([]);

  useEffect(() => {
    CourseService.list()
      .then((res) => setCourses((res as any).courses ?? []))
      .catch(() => {});
  }, []);

  const defaultValues = useMemo<ClassroomFormValues>(
    () => ({
      name: currentClassroom?.name ?? '',
      courseId: currentClassroom?.course?.id ?? '',
    }),
    [currentClassroom]
  );

  const methods = useForm<ClassroomFormValues>({ resolver: zodResolver(ClassroomSchema), defaultValues });
  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  useEffect(() => { if (currentClassroom) reset(defaultValues); }, [currentClassroom, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload: ClassroomCreatePayload = {
        name: data.name,
        courseId: data.courseId || undefined,
      };
      if (isEdit && currentClassroom) {
        await ClassroomService.update(currentClassroom.id, payload);
        toast.success('Turma atualizada!');
      } else {
        await ClassroomService.create(payload);
        toast.success('Turma criada!');
      }
      router.push(paths.dashboard.classrooms.root);
    } catch (error: any) {
      toast.error(error?.message ?? 'Erro ao salvar turma');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Dados da turma</Typography>
            <Stack spacing={2}>
              <Field.Text name="name" label="Nome da turma *" />
              <Field.Select name="courseId" label="Curso">
                <MenuItem value="">Sem curso</MenuItem>
                {courses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Field.Select>
            </Stack>
          </Card>
        </Grid>
        <Grid xs={12} md={4}>
          <Stack spacing={2}>
            <Button fullWidth variant="outlined" onClick={() => router.push(paths.dashboard.classrooms.root)}>
              Cancelar
            </Button>
            <LoadingButton fullWidth type="submit" variant="contained" loading={isSubmitting}>
              {isEdit ? 'Salvar' : 'Criar turma'}
            </LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </Form>
  );
}

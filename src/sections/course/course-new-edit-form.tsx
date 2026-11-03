'use client';

import type { CourseDetail, CourseCreatePayload } from 'src/types/services/course';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';

import { CourseService } from 'src/services/course';
import { TeacherService } from 'src/services/teacher';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

const CourseSchema = zod.object({
  name: zod.string().trim().min(2, 'Nome obrigatório'),
  description: zod.string().trim().min(1, 'Descrição obrigatória'),
  workload: zod.coerce.number().positive('Informe uma carga horária maior que zero'),
  teachers: zod.array(zod.string()),
  materialsText: zod.string(),
});

type CourseFormValues = zod.infer<typeof CourseSchema>;

type Props = { currentCourse?: CourseDetail };

export function CourseNewEditForm({ currentCourse }: Props) {
  const router = useRouter();
  const isEdit = !!currentCourse;
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [teachersError, setTeachersError] = useState(false);
  useEffect(() => {
    let active = true;
    TeacherService.list({ hasPagination: false }).then((res) => {
      if (active) setTeachers(res.teachers);
    }).catch(() => { if (active) setTeachersError(true); });
    return () => { active = false; };
  }, []);

  const defaultValues = useMemo<CourseFormValues>(
    () => ({
      name: currentCourse?.name ?? '',
      description: currentCourse?.description ?? '',
      workload: currentCourse?.workload ?? 0,
      teachers: currentCourse?.teachers?.map((teacher) => teacher.id) ?? [],
      materialsText: '',
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
        teachers: data.teachers,
        materials: [
          ...(currentCourse?.materials ?? []).filter((material) => material.courseId === currentCourse?.id)
            .map((material) => ({ id: material.id, name: material.name })),
          ...Array.from(new Set(data.materialsText.split('\n').map((name) => name.trim()).filter(Boolean)))
            .filter((name) => !currentCourse?.materials?.some((material) => material.name === name))
            .map((name) => ({ name })),
        ],
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
              <Field.Text name="description" label="Descrição *" multiline rows={3} />
              <Field.Text name="workload" label="Carga horária (horas) *" type="number" inputProps={{ min: 0.01, step: 'any' }} />
              {teachersError && <Alert severity="warning">Não foi possível carregar a lista de professores. Os vínculos atuais serão preservados.</Alert>}
              <Field.MultiSelect name="teachers" label="Professores" chip checkbox disabled={teachersError}
                options={Array.from(new Map([...(currentCourse?.teachers ?? []), ...teachers].map((teacher) => [teacher.id, teacher])).values()).map((teacher) => ({ value: teacher.id, label: teacher.name }))}
                helperText="Selecione os professores responsáveis por este curso." />
              {isEdit && !!currentCourse?.materials?.length && <Alert severity="info">
                Materiais já disponíveis: {currentCourse.materials.map((material) => material.name).join(', ')}. Os materiais existentes e os materiais gerais da escola serão preservados.
              </Alert>}
              <Field.Text name="materialsText" label={isEdit ? "Novos materiais do curso" : "Materiais do curso"} multiline minRows={3}
                helperText="Adicione um material por linha. Ex.: Apostila, caderno de atividades." />
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

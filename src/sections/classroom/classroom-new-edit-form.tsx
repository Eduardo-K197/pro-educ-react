'use client';

import type { CourseListItem } from 'src/types/services/course';
import type { ClassroomDetail, ClassroomCreatePayload } from 'src/types/services/classroom';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';

import { CourseService } from 'src/services/course';
import { TeacherService } from 'src/services/teacher';
import { ClassroomService } from 'src/services/classroom';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const ClassroomSchema = zod.object({
  name: zod.string().trim().min(2, 'Nome obrigatório'),
  course: zod.string().min(1, 'Selecione o curso da turma'),
  teachers: zod.array(zod.string()),
  startAt: zod.string().min(1, 'Data de início obrigatória'),
  maxStudentCount: zod.coerce.number().int().positive().optional().or(zod.literal('')),
  minStudentAge: zod.coerce.number().int().min(0).optional().or(zod.literal('')),
});

type ClassroomFormValues = zod.infer<typeof ClassroomSchema>;

type Props = { currentClassroom?: ClassroomDetail };

export function ClassroomNewEditForm({ currentClassroom }: Props) {
  const router = useRouter();
  const isEdit = !!currentClassroom;
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [referenceError, setReferenceError] = useState(false);
  const [referencesLoading, setReferencesLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([CourseService.list({ hasPagination: false }), TeacherService.list({ hasPagination: false })])
      .then(([courseRes, teacherRes]) => {
        if (active) { setCourses(courseRes.courses); setTeachers(teacherRes.teachers); }
      }).catch(() => { if (active) setReferenceError(true); })
      .finally(() => { if (active) setReferencesLoading(false); });
    return () => { active = false; };
  }, []);

  const defaultValues = useMemo<ClassroomFormValues>(
    () => ({
      name: currentClassroom?.name ?? '',
      course: currentClassroom?.course?.id ?? '',
      teachers: currentClassroom?.teachers?.map((teacher) => teacher.id) ?? [],
      startAt: currentClassroom?.startAt ? currentClassroom.startAt.substring(0, 10) : '',
      maxStudentCount: currentClassroom?.maxStudentCount ?? '',
      minStudentAge: currentClassroom?.minStudentAge ?? '',
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
        course: data.course,
        teachers: data.teachers,
        startAt: data.startAt,
        maxStudentCount: data.maxStudentCount ? Number(data.maxStudentCount) : undefined,
        minStudentAge: data.minStudentAge !== '' ? Number(data.minStudentAge) : undefined,
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
            <Stack spacing={2.5}>
              {referenceError && <Alert severity="error">Não foi possível carregar cursos e professores. Atualize a página antes de salvar para preservar os vínculos.</Alert>}
              {!referencesLoading && !referenceError && courses.length === 0 && <Alert severity="info">Cadastre um curso antes de criar a turma.</Alert>}
              <Field.Text name="name" label="Nome da turma *" />

              <Field.Select name="course" label="Curso *" disabled={referencesLoading || referenceError}>
                <MenuItem value="">Selecione o curso</MenuItem>
                {courses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Field.Select>

              <Field.MultiSelect name="teachers" label="Professores da turma" chip checkbox disabled={referencesLoading || referenceError}
                options={Array.from(new Map([...(currentClassroom?.teachers ?? []), ...teachers].map((teacher) => [teacher.id, teacher])).values()).map((teacher) => ({ value: teacher.id, label: teacher.name }))}
                helperText="Selecione os professores que acompanham a turma." />
              <Field.Text name="startAt" label="Data de início *" type="date" InputLabelProps={{ shrink: true }} />

              <Grid container spacing={2}>
                <Grid xs={6}>
                  <Field.Text name="maxStudentCount" label="Máx. de alunos" type="number" inputProps={{ min: 1 }} />
                </Grid>
                <Grid xs={6}>
                  <Field.Text name="minStudentAge" label="Idade mínima" type="number" inputProps={{ min: 0 }} />
                </Grid>
              </Grid>
            </Stack>
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <LoadingButton fullWidth type="submit" variant="contained" color="primary" loading={isSubmitting} disabled={referencesLoading || referenceError || courses.length === 0}>
                {isEdit ? 'Salvar alterações' : 'Criar turma'}
              </LoadingButton>
              <Button fullWidth variant="outlined" color="inherit" onClick={() => router.push(paths.dashboard.classrooms.root)}>
                Cancelar
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}

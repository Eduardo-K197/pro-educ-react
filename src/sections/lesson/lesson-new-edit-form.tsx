'use client';

import type { LessonDetail, LessonCreatePayload } from 'src/types/services/lesson';
import type { CourseListItem } from 'src/types/services/course';
import type { TeacherListItem } from 'src/types/services/teacher';
import type { ClassroomListItem } from 'src/types/services/classroom';

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
import { LessonService } from 'src/services/lesson';
import { CourseService } from 'src/services/course';
import { TeacherService } from 'src/services/teacher';
import { ClassroomService } from 'src/services/classroom';

const LessonSchema = zod.object({
  courseId: zod.string().min(1, 'Curso obrigatório'),
  teacherId: zod.string().min(1, 'Professor obrigatório'),
  classroomId: zod.string().optional(),
  date: zod.string().optional(),
  name: zod.string().optional(),
});

type LessonFormValues = zod.infer<typeof LessonSchema>;

type Props = { currentLesson?: LessonDetail };

export function LessonNewEditForm({ currentLesson }: Props) {
  const router = useRouter();
  const isEdit = !!currentLesson;

  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomListItem[]>([]);

  useEffect(() => {
    Promise.all([
      CourseService.list().then((r) => setCourses((r as any).courses ?? [])),
      TeacherService.list().then((r) => setTeachers((r as any).teachers ?? [])),
      ClassroomService.list().then((r) => setClassrooms((r as any).classrooms ?? [])),
    ]).catch(() => {});
  }, []);

  const defaultValues = useMemo<LessonFormValues>(
    () => ({
      courseId: currentLesson?.course?.id ?? '',
      teacherId: currentLesson?.teacher?.id ?? '',
      classroomId: currentLesson?.classroom?.id ?? '',
      date: currentLesson?.date ? currentLesson.date.substring(0, 10) : '',
      name: currentLesson?.name ?? '',
    }),
    [currentLesson]
  );

  const methods = useForm<LessonFormValues>({ resolver: zodResolver(LessonSchema), defaultValues });
  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  useEffect(() => { if (currentLesson) reset(defaultValues); }, [currentLesson, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload: LessonCreatePayload = {
        courseId: data.courseId,
        teacherId: data.teacherId,
        classroomId: data.classroomId || undefined,
        date: data.date || undefined,
        name: data.name || undefined,
      };
      if (isEdit && currentLesson) {
        await LessonService.update(currentLesson.id, payload);
        toast.success('Aula atualizada!');
      } else {
        await LessonService.create(payload);
        toast.success('Aula criada!');
      }
      router.push(paths.dashboard.lessons.root);
    } catch (error: any) {
      toast.error(error?.message ?? 'Erro ao salvar aula');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Dados da aula</Typography>
            <Stack spacing={2}>
              <Field.Text name="name" label="Nome / título da aula (opcional)" />
              <Field.Select name="courseId" label="Curso *">
                <MenuItem value="">Selecione o curso</MenuItem>
                {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Field.Select>
              <Field.Select name="teacherId" label="Professor *">
                <MenuItem value="">Selecione o professor</MenuItem>
                {teachers.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
              </Field.Select>
              <Field.Select name="classroomId" label="Turma">
                <MenuItem value="">Sem turma</MenuItem>
                {classrooms.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Field.Select>
              <Field.Text name="date" label="Data da aula" type="date" InputLabelProps={{ shrink: true }} />
            </Stack>
          </Card>
        </Grid>
        <Grid xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <LoadingButton fullWidth type="submit" variant="contained" color="primary" loading={isSubmitting}>
                {isEdit ? 'Salvar alterações' : 'Criar aula'}
              </LoadingButton>
              <Button fullWidth variant="outlined" color="inherit" onClick={() => router.push(paths.dashboard.lessons.root)}>
                Cancelar
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}

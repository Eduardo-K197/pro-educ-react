'use client';

import type { LessonDetail, LessonCreatePayload } from 'src/types/services/lesson';
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
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { LessonService } from 'src/services/lesson';
import { TeacherService } from 'src/services/teacher';
import { ClassroomService } from 'src/services/classroom';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = ['Agendada', 'Realizada', 'Cancelada'];

const LessonSchema = zod.object({
  classroom: zod.string().min(1, 'Turma obrigatória'),
  teacher: zod.string().min(1, 'Professor obrigatório'),
  date: zod.string().min(1, 'Data obrigatória'),
  startTime: zod.string().min(1, 'Horário de início obrigatório'),
  endTime: zod.string().min(1, 'Horário de término obrigatório'),
  status: zod.string().min(1, 'Status obrigatório'),
  details: zod.string().optional(),
});

type LessonFormValues = zod.infer<typeof LessonSchema>;

type Props = { currentLesson?: LessonDetail };

export function LessonNewEditForm({ currentLesson }: Props) {
  const router = useRouter();
  const isEdit = !!currentLesson;

  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomListItem[]>([]);

  useEffect(() => {
    Promise.all([
      TeacherService.list({ perPage: 1000 }).then((r) => setTeachers((r as any).teachers ?? [])),
      ClassroomService.list({ perPage: 1000 }).then((r) => setClassrooms((r as any).classrooms ?? [])),
    ]).catch(() => {});
  }, []);

  const defaultValues = useMemo<LessonFormValues>(
    () => ({
      classroom: currentLesson?.classroom?.id ?? '',
      teacher: currentLesson?.teacher?.id ?? '',
      date: currentLesson?.date ? currentLesson.date.substring(0, 10) : '',
      startTime: currentLesson?.startTime ?? '',
      endTime: currentLesson?.endTime ?? '',
      status: currentLesson?.status ?? 'Agendada',
      details: currentLesson?.details ?? '',
    }),
    [currentLesson]
  );

  const methods = useForm<LessonFormValues>({ resolver: zodResolver(LessonSchema), defaultValues });
  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  useEffect(() => { if (currentLesson) reset(defaultValues); }, [currentLesson, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload: LessonCreatePayload = {
        classroom: data.classroom,
        teacher: data.teacher,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status,
        details: data.details || undefined,
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
            <Stack spacing={2.5}>
              <Field.Select name="classroom" label="Turma *">
                <MenuItem value="">Selecione a turma</MenuItem>
                {classrooms.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Field.Select>

              <Field.Select name="teacher" label="Professor *">
                <MenuItem value="">Selecione o professor</MenuItem>
                {teachers.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
              </Field.Select>

              <Field.Text name="date" label="Data da aula *" type="date" InputLabelProps={{ shrink: true }} />

              <Grid container spacing={2}>
                <Grid xs={6}>
                  <Field.Text name="startTime" label="Início *" type="time" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid xs={6}>
                  <Field.Text name="endTime" label="Término *" type="time" InputLabelProps={{ shrink: true }} />
                </Grid>
              </Grid>

              <Field.Select name="status" label="Status *">
                {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Field.Select>

              <Field.Text name="details" label="Descrição / observações" multiline minRows={2} />
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

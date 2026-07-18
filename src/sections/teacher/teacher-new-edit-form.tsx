'use client';

import type { TeacherDetail, TeacherCreatePayload } from 'src/types/services/teacher';
import type { CourseListItem } from 'src/types/services/course';

import { z as zod } from 'zod';
import { useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { TeacherService } from 'src/services/teacher';
import { CourseService } from 'src/services/course';

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentTeacher?.pictureUrl ?? null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(
    currentTeacher?.courses?.map((c) => c.id) ?? []
  );
  const [availableCourses, setAvailableCourses] = useState<CourseListItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    CourseService.list({ perPage: '200' })
      .then((res) => setAvailableCourses(res.courses ?? []))
      .catch(() => {});
  }, []);

  // Sync picture preview when switching between edit targets
  useEffect(() => {
    if (!selectedFile) setPreviewUrl(currentTeacher?.pictureUrl ?? null);
  }, [currentTeacher, selectedFile]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (selectedFile || selectedCourseIds.length > 0) {
        // Use multipart when photo is being uploaded or courses are selected
        const fd = new FormData();
        fd.append('name', data.name);
        fd.append('email', data.email);
        fd.append('phoneNumber', data.phoneNumber);
        if (data.birthDate) fd.append('birthDate', data.birthDate);
        if (data.hourlyProfit !== undefined) fd.append('hourlyProfit', String(data.hourlyProfit));
        if (data.password) fd.append('password', data.password);
        selectedCourseIds.forEach((id) => fd.append('courses', id));
        if (selectedFile) fd.append('picture', selectedFile);

        if (isEdit && currentTeacher) {
          await TeacherService.updateMultipart(currentTeacher.id, fd);
          toast.success('Professor atualizado!');
        } else {
          await TeacherService.createMultipart(fd);
          toast.success('Professor criado!');
        }
      } else {
        const payload: TeacherCreatePayload = {
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
          birthDate: data.birthDate || undefined,
          hourlyProfit: data.hourlyProfit,
          password: data.password || undefined,
        };
        if (isEdit && currentTeacher) {
          await TeacherService.update(currentTeacher.id, payload);
          toast.success('Professor atualizado!');
        } else {
          await TeacherService.create(payload);
          toast.success('Professor criado!');
        }
      }
      router.push(paths.dashboard.teachers.root);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? error?.message ?? 'Erro ao salvar professor');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* ── Left card: fields ── */}
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
                  <Field.Text
                    name="birthDate"
                    label="Data de nascimento"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
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

              {/* Cursos */}
              <FormControl fullWidth size="small">
                <InputLabel>Cursos que leciona</InputLabel>
                <Select
                  multiple
                  value={selectedCourseIds}
                  label="Cursos que leciona"
                  onChange={(e) =>
                    setSelectedCourseIds(
                      typeof e.target.value === 'string'
                        ? e.target.value.split(',')
                        : (e.target.value as string[])
                    )
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((id) => {
                        const course = availableCourses.find((c) => c.id === id);
                        return (
                          <Chip
                            key={id}
                            label={course?.name ?? id}
                            size="small"
                            variant="soft"
                            color="primary"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {availableCourses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      <Checkbox checked={selectedCourseIds.includes(course.id)} size="small" />
                      <ListItemText primary={course.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Card>
        </Grid>

        {/* ── Right card: photo + actions ── */}
        <Grid xs={12} md={4}>
          <Stack spacing={3}>
            {/* Photo upload */}
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Foto do professor
              </Typography>

              <Stack alignItems="center" spacing={1.5}>
                <Box
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    '&:hover .overlay': { opacity: 1 },
                  }}
                >
                  <Avatar
                    src={previewUrl ?? undefined}
                    sx={{ width: 96, height: 96, fontSize: 36 }}
                  >
                    {!previewUrl && (currentTeacher?.name?.charAt(0).toUpperCase() ?? '?')}
                  </Avatar>

                  <Box
                    className="overlay"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      bgcolor: 'rgba(0,0,0,0.48)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      color: 'common.white',
                    }}
                  >
                    <Iconify icon="solar:camera-add-bold" width={22} />
                    <Typography variant="caption" sx={{ mt: 0.25, lineHeight: 1.2, textAlign: 'center', px: 0.5 }}>
                      Alterar foto
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="caption" color="text.disabled" textAlign="center">
                  Clique na foto para selecionar
                  <br />
                  JPG, PNG ou WebP
                </Typography>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </Stack>
            </Card>

            {/* Actions */}
            <Card sx={{ p: 3 }}>
              <Stack spacing={1.5}>
                <LoadingButton
                  fullWidth
                  type="submit"
                  variant="contained"
                  color="primary"
                  loading={isSubmitting}
                >
                  {isEdit ? 'Salvar alterações' : 'Criar professor'}
                </LoadingButton>
                <Button
                  fullWidth
                  variant="outlined"
                  color="inherit"
                  onClick={() => router.push(paths.dashboard.teachers.root)}
                >
                  Cancelar
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Form>
  );
}

'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import { CourseService } from 'src/services/course';

// ----------------------------------------------------------------------

type Props = { id: string };

export function CourseDetailsView({ id }: Props) {
  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    CourseService.getById(id)
      .then(setCourse)
      .catch(() => toast.error('Erro ao carregar curso'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '50vh' }}>
          <CircularProgress />
        </Stack>
      </DashboardContent>
    );
  }

  if (!course) return null;

  const teachers: any[] = course.teachers ?? [];
  const modules: any[] = course.modules ?? [];
  const materials: any[] = course.materials ?? [];
  const courseSubjects: any[] = course.courseSubjects ?? [];

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={course.name}
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Cursos', href: paths.dashboard.courses.root },
          { name: course.name },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.courses.edit(id)}
            variant="contained"
            startIcon={<Iconify icon="solar:pen-bold" />}
          >
            Editar
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        {/* Resumo */}
        <Grid xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Informações do curso</Typography>
              <Divider />

              {course.description && (
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">Descrição</Typography>
                  <Typography variant="body2">{course.description}</Typography>
                </Stack>
              )}

              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                {course.workload != null && (
                  <Stack spacing={0.5} alignItems="center" sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
                    <Typography variant="h4">{course.workload}h</Typography>
                    <Typography variant="caption" color="text.secondary">Carga horária</Typography>
                  </Stack>
                )}
                <Stack spacing={0.5} alignItems="center" sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
                  <Typography variant="h4">{teachers.length}</Typography>
                  <Typography variant="caption" color="text.secondary">Professores</Typography>
                </Stack>
                {modules.length > 0 && (
                  <Stack spacing={0.5} alignItems="center" sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
                    <Typography variant="h4">{modules.length}</Typography>
                    <Typography variant="caption" color="text.secondary">Módulos</Typography>
                  </Stack>
                )}
                {materials.length > 0 && (
                  <Stack spacing={0.5} alignItems="center" sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
                    <Typography variant="h4">{materials.length}</Typography>
                    <Typography variant="caption" color="text.secondary">Materiais</Typography>
                  </Stack>
                )}
              </Box>

              {teachers.length > 0 && (
                <>
                  <Divider />
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Professores</Typography>
                    {teachers.map((t: any) => (
                      <Stack key={t.id} direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                          {t.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">{t.name}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </>
              )}
            </Stack>
          </Card>
        </Grid>

        {/* Conteúdo do curso */}
        <Grid xs={12} md={8}>
          <Stack spacing={3}>
            {modules.length > 0 && (
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Módulos ({modules.length})
                </Typography>
                <Stack spacing={1}>
                  {modules.map((mod: any, idx: number) => (
                    <Stack key={mod.id ?? idx} direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 24, height: 24, borderRadius: '50%',
                          bgcolor: 'primary.main', color: 'common.white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </Box>
                      <Typography variant="body2">{mod.title ?? mod.name ?? `Módulo ${idx + 1}`}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Card>
            )}

            {courseSubjects.length > 0 && (
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Disciplinas ({courseSubjects.length})
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {courseSubjects.map((cs: any, idx: number) => (
                    <Chip
                      key={cs.id ?? idx}
                      label={cs.subject?.name ?? cs.name ?? `Disciplina ${idx + 1}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Card>
            )}

            {materials.length > 0 && (
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Materiais ({materials.length})
                </Typography>
                <Stack spacing={1}>
                  {materials.map((mat: any, idx: number) => (
                    <Stack key={mat.id ?? idx} direction="row" spacing={1} alignItems="center">
                      <Iconify icon="solar:file-bold" width={16} sx={{ color: 'text.secondary', flexShrink: 0 }} />
                      <Typography variant="body2">{mat.name ?? `Material ${idx + 1}`}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Card>
            )}

            {modules.length === 0 && courseSubjects.length === 0 && materials.length === 0 && (
              <Card sx={{ p: 3 }}>
                <Stack alignItems="center" sx={{ py: 3 }}>
                  <Iconify icon="solar:book-bold" width={48} sx={{ color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Nenhum conteúdo cadastrado para este curso
                  </Typography>
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.courses.edit(id)}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 2 }}
                  >
                    Adicionar conteúdo
                  </Button>
                </Stack>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}

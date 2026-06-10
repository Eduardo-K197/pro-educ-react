'use client';

import { useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { toast } from 'src/components/snackbar';

import type { CourseDetail } from 'src/types/services/course';
import { CourseService } from 'src/services/course';
import { CourseNewEditForm } from '../course-new-edit-form';

type Props = { id: string };

export function CourseEditView({ id }: Props) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
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

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Editar curso"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Cursos', href: paths.dashboard.courses.root },
          { name: course?.name ?? 'Editar' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <CourseNewEditForm currentCourse={course ?? undefined} />
    </DashboardContent>
  );
}

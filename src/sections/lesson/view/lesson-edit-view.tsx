'use client';

import { useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { toast } from 'src/components/snackbar';

import type { LessonDetail } from 'src/types/services/lesson';
import { LessonService } from 'src/services/lesson';
import { LessonNewEditForm } from '../lesson-new-edit-form';

type Props = { id: string };

export function LessonEditView({ id }: Props) {
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LessonService.getById(id)
      .then(setLesson)
      .catch(() => toast.error('Erro ao carregar aula'))
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
        heading="Editar aula"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Aulas', href: paths.dashboard.lessons.root },
          { name: lesson?.details ?? 'Editar' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <LessonNewEditForm currentLesson={lesson ?? undefined} />
    </DashboardContent>
  );
}

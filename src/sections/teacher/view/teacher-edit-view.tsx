'use client';

import { useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { toast } from 'src/components/snackbar';

import type { TeacherDetail } from 'src/types/services/teacher';
import { TeacherService } from 'src/services/teacher';
import { TeacherNewEditForm } from '../teacher-new-edit-form';

type Props = { id: string };

export function TeacherEditView({ id }: Props) {
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    TeacherService.getById(id)
      .then(setTeacher)
      .catch(() => toast.error('Erro ao carregar professor'))
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
        heading="Editar professor"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Professores', href: paths.dashboard.teachers.root },
          { name: teacher?.name ?? 'Editar' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <TeacherNewEditForm currentTeacher={teacher ?? undefined} />
    </DashboardContent>
  );
}

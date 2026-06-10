'use client';

import { useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { toast } from 'src/components/snackbar';

import type { ClassroomDetail } from 'src/types/services/classroom';
import { ClassroomService } from 'src/services/classroom';
import { ClassroomNewEditForm } from '../classroom-new-edit-form';

type Props = { id: string };

export function ClassroomEditView({ id }: Props) {
  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ClassroomService.getById(id)
      .then(setClassroom)
      .catch(() => toast.error('Erro ao carregar turma'))
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
        heading="Editar turma"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Turmas', href: paths.dashboard.classrooms.root },
          { name: classroom?.name ?? 'Editar' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <ClassroomNewEditForm currentClassroom={classroom ?? undefined} />
    </DashboardContent>
  );
}

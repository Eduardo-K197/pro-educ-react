'use client';

import { useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { toast } from 'src/components/snackbar';

import type { StudentDetail } from 'src/types/services/student';
import { StudentService } from 'src/services/student';
import { StudentNewEditForm } from '../student-new-edit-form';

// ----------------------------------------------------------------------

type Props = { id: string };

export function StudentEditView({ id }: Props) {
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    StudentService.getById(id)
      .then(setStudent)
      .catch(() => toast.error('Erro ao carregar aluno'))
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
        heading="Editar aluno"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Alunos', href: paths.dashboard.students.root },
          { name: student?.name ?? 'Editar' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <StudentNewEditForm currentStudent={student ?? undefined} />
    </DashboardContent>
  );
}

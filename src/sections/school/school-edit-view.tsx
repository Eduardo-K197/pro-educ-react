'use client';

import type { SchoolDetail } from 'src/types/services/school';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import { Typography } from '@mui/material';

import { paths } from 'src/routes/paths';

import { SchoolService } from 'src/services/school';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SchoolNewEditForm } from './school-new-edit-form';

export function SchoolEditView() {
  const params = useParams();
  const { id } = params as { id?: string };

  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const data = await SchoolService.getById(id);
        setSchool(data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao carregar escola', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit school"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Schools', href: paths.dashboard.schools.root },
          { name: school?.name || 'Edit' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {loading && <Typography>Carregando...</Typography>}

      {!loading && !school && <Typography>Escola não encontrada.</Typography>}

      {!loading && school && <SchoolNewEditForm currentSchool={school} />}
    </DashboardContent>
  );
}

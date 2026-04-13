'use client';

import type { AdminDetail } from 'src/types/services/admin';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { AdminService } from 'src/services/admin';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AdminNewEditForm } from '../admin-new-edit-form';

// ----------------------------------------------------------------------

export function AdminEditView() {
  const params = useParams();
  const { id } = params as { id?: string };

  const [admin, setAdmin] = useState<AdminDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadAdmin = async () => {
      try {
        const data = await AdminService.detail(id);
        setAdmin(data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao carregar administrador', error);
      } finally {
        setLoading(false);
      }
    };

    void loadAdmin();
  }, [id]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Editar administrador"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Administradores', href: paths.dashboard.admins.root },
          { name: admin?.name || 'Editar' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {loading && <Typography>Carregando...</Typography>}
      {!loading && !admin && <Typography>Administrador não encontrado.</Typography>}
      {!loading && admin && <AdminNewEditForm currentAdmin={admin} />}
    </DashboardContent>
  );
}

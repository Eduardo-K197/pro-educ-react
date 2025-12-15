'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Card, Stack, Typography, Grid, Chip, Divider, Button } from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Iconify } from 'src/components/iconify';
import { paths } from 'src/routes/paths';

import type { SchoolDetail } from 'src/types/services/school';
import { SchoolService } from 'src/services/school';

export function SchoolDetailsView() {
  const params = useParams();
  const id = (params as { id?: string }).id;

  const router = useRouter();

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

    void load();
  }, [id]);

  if (loading) {
    return (
      <DashboardContent>
        <Typography>Carregando...</Typography>
      </DashboardContent>
    );
  }

  if (!school) {
    return (
      <DashboardContent>
        <Typography>Escola não encontrada.</Typography>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="School details"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Schools', href: paths.dashboard.schools.root },
          { name: school.name },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:edit-2-fill" />}
            onClick={() => router.push(paths.dashboard.schools.edit(school.id))}
          >
            Edit
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Nome */}
          <Typography variant="h6">{school.name}</Typography>

          {/* Linha com token / modos */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Asaas token
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                }}
              >
                {school.asaasToken || '-'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Sandbox mode
              </Typography>
              <Typography variant="body2">
                {school.asaasSandboxMode ? 'Enabled' : 'Disabled'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Homologation mode
              </Typography>
              <Typography variant="body2">
                {school.asaasHomologationMode ? 'Enabled' : 'Disabled'}
              </Typography>
            </Grid>
          </Grid>

          {/* Certificado, se existir */}
          {school.certificateUrl && (
            <>
              <Divider />

              <Typography variant="subtitle2" gutterBottom>
                Certificate
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                }}
              >
                {school.certificateUrl}
              </Typography>
            </>
          )}

          <Divider />

          {/* Admins x Employees */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Admins
              </Typography>

              {school.admins?.length ? (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {school.admins.map((admin) => (
                    <Chip
                      key={admin.id}
                      label={admin.name}
                      size="small"
                      sx={{ borderRadius: 999 }}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No admins.
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Employees
              </Typography>

              {school.employees?.length ? (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {school.employees.map((employee) => (
                    <Chip
                      key={employee.id}
                      label={employee.name || 'Sem nome'}
                      size="small"
                      sx={{ borderRadius: 999 }}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No employees.
                </Typography>
              )}
            </Grid>
          </Grid>

          <Divider />

          {/* Materials x Categories */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Materials
              </Typography>

              {school.materials?.length ? (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {school.materials.map((material) => (
                    <Chip
                      key={material.id}
                      label={material.name}
                      size="small"
                      sx={{ borderRadius: 999 }}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No materials.
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Categories
              </Typography>

              {school.categories?.length ? (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {school.categories.map((category) => (
                    <Chip
                      key={category.id}
                      label={category.name}
                      size="small"
                      sx={{ borderRadius: 999 }}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No categories.
                </Typography>
              )}
            </Grid>
          </Grid>

          <Divider />

          {/* Groups */}
          <div>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Groups
            </Typography>

            {school.groups?.length ? (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {school.groups.map((group) => (
                  <Chip key={group.id} label={group.name} size="small" sx={{ borderRadius: 999 }} />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No groups.
              </Typography>
            )}
          </div>
        </Stack>
      </Card>
    </DashboardContent>
  );
}

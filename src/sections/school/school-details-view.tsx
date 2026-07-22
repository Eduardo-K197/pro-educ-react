'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Box, Card, Stack, Typography, Grid, Chip, Divider, Button, Tooltip, IconButton, Alert, AlertTitle } from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Iconify } from 'src/components/iconify';
import { paths } from 'src/routes/paths';

import type { SchoolDetail } from 'src/types/services/school';
import { SchoolService } from 'src/services/school';
import { useSchoolMode } from 'src/hooks/use-school-mode';
import { SchoolQuickAddAdmin } from './school-quick-add-admin';

export function SchoolDetailsView() {
  const params = useParams();
  const id = (params as { id?: string }).id;

  const router = useRouter();
  const { enterSchool } = useSchoolMode();

  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [openAddAdmin, setOpenAddAdmin] = useState(false);

  const loadSchool = useCallback(async () => {
    if (!id) return;
    try {
      const data = await SchoolService.getById(id);
      setSchool(data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao carregar escola', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadSchool(); }, [loadSchool]);

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

  // certificateUrl pode vir como _certificateFilename do back; preferimos uma única variável
  const certificateValue = school.certificateUrl || school._certificateFilename || null;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Detalhes da escola"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Escolas', href: paths.dashboard.schools.root },
          { name: school.name },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="solar:login-bold-duotone" />}
              onClick={() => enterSchool(school.id)}
            >
              Acessar escola
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:edit-2-fill" />}
              onClick={() => router.push(paths.dashboard.schools.edit(school.id))}
            >
              Editar
            </Button>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Nome */}
          <Typography variant="h6">{school.name}</Typography>

          {/* Provedor de pagamentos */}
          {school.paymentProvider === 'cora' ? (
            <Alert
              severity={school.coraAccount?.clientId ? 'success' : 'warning'}
              icon={<Iconify icon="mdi:bank" />}
            >
              <AlertTitle>
                Banco Cora{school.coraAccount?.clientId ? ' — Configurada' : ' — Pendente de configuração'}
              </AlertTitle>
              {school.coraAccount?.clientId && (
                <>
                  Conta: <strong>{school.coraAccount.name}</strong> &bull;{' '}
                  Ambiente: <strong>{school.coraAccount.environment === 'production' ? 'Produção' : 'Homologação'}</strong>
                </>
              )}
            </Alert>
          ) : school.paymentProvider === 'sicredi' ? (
            <Alert
              severity={school.sicrediAccount?.clientId ? 'success' : 'warning'}
              icon={<Iconify icon="mdi:bank-transfer" />}
            >
              <AlertTitle>
                Sicredi{school.sicrediAccount?.clientId ? ' — Configurado' : ' — Pendente de configuração'}
              </AlertTitle>
              {school.sicrediAccount?.clientId && (
                <>
                  Cooperativa: <strong>{school.sicrediAccount.cooperativa}</strong> &bull;{' '}
                  Posto: <strong>{school.sicrediAccount.posto}</strong> &bull;{' '}
                  Beneficiário: <strong>{school.sicrediAccount.codigoBeneficiario}</strong> &bull;{' '}
                  Ambiente: <strong>{school.sicrediAccount.environment === 'production' ? 'Produção' : 'Homologação'}</strong>
                </>
              )}
            </Alert>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>Token do Asaas</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {school.asaasToken || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>Modo sandbox</Typography>
                <Typography variant="body2">{school.asaasSandboxMode ? 'Ativado' : 'Desativado'}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>Modo homologação</Typography>
                <Typography variant="body2">{school.asaasHomologationMode ? 'Ativado' : 'Desativado'}</Typography>
              </Grid>
            </Grid>
          )}

          {/* Modelo de certificado */}
          {certificateValue && (
            <>
              <Divider />

              <Typography variant="subtitle2" gutterBottom>
                Modelo de certificado
              </Typography>

              <Box
                sx={{
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.neutral',
                  maxWidth: 480,
                }}
              >
                <Box
                  component="img"
                  src={certificateValue}
                  alt="Modelo de certificado"
                  sx={{ width: '100%', display: 'block', maxHeight: 240, objectFit: 'cover' }}
                  onError={(e: any) => { e.target.style.display = 'none'; }}
                />
              </Box>
            </>
          )}

          <Divider />

          {/* Admins x Employees */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography
                  variant="overline"
                  sx={{ color: 'text.secondary', letterSpacing: 1.1, lineHeight: 1 }}
                >
                  Administradores
                </Typography>
                <Tooltip title="Vincular administrador">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => setOpenAddAdmin(true)}
                    sx={{ width: 28, height: 28 }}
                  >
                    <Iconify icon="mingcute:add-line" width={16} />
                  </IconButton>
                </Tooltip>
              </Stack>

              {school.admins?.length ? (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {school.admins.map((admin) => (
                    <Chip key={admin.id} label={admin.name} size="small" sx={{ borderRadius: 999 }} />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum administrador vinculado.
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography
                variant="overline"
                sx={{ color: 'text.secondary', letterSpacing: 1.1, lineHeight: 1, display: 'block', mb: 1.5 }}
              >
                Funcionários
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
                  Nenhum funcionário vinculado.
                </Typography>
              )}
            </Grid>
          </Grid>

          <Divider />

          {/* Materials x Categories */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography
                variant="overline"
                sx={{ color: 'text.secondary', letterSpacing: 1.1, lineHeight: 1, display: 'block', mb: 1.5 }}
              >
                Materiais
              </Typography>

              {school.materials?.length ? (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {school.materials.map((material) => (
                    <Chip key={material.id} label={material.name} size="small" sx={{ borderRadius: 999 }} />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum material cadastrado.
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography
                variant="overline"
                sx={{ color: 'text.secondary', letterSpacing: 1.1, lineHeight: 1, display: 'block', mb: 1.5 }}
              >
                Categorias
              </Typography>

              {school.categories?.length ? (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {school.categories.map((category) => (
                    <Chip key={category.id} label={category.name} size="small" sx={{ borderRadius: 999 }} />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma categoria cadastrada.
                </Typography>
              )}
            </Grid>
          </Grid>

          <Divider />

          {/* Groups */}
          <div>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', letterSpacing: 1.1, lineHeight: 1, display: 'block', mb: 1.5 }}
            >
              Grupos
            </Typography>

            {school.groups?.length ? (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {school.groups.map((group) => (
                  <Chip key={group.id} label={group.name} size="small" sx={{ borderRadius: 999 }} />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Nenhum grupo vinculado.
              </Typography>
            )}
          </div>
        </Stack>
      </Card>

      <SchoolQuickAddAdmin
        open={openAddAdmin}
        onClose={() => setOpenAddAdmin(false)}
        schoolId={school.id}
        linkedAdminIds={school.admins?.map((a) => a.id) ?? []}
        onRefresh={loadSchool}
      />
    </DashboardContent>
  );
}

'use client';

import type { IGroupItem } from 'src/types/group';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { GroupService } from 'src/services/group';
import { AdminService } from 'src/services/admin';
import { SchoolService } from 'src/services/school';

import { DashboardContent } from 'src/layouts/dashboard';
import { SeoIllustration } from 'src/assets/illustrations';
import { _appFeatured } from 'src/_mock';

import { svgColorClasses } from 'src/components/svg-color';
import { useAuthContext } from 'src/auth/hooks';
import { RouterLink } from 'src/routes/components';

import { AppWidget } from '../app-widget';
import { AppWelcome } from '../app-welcome';
import { AppFeatured } from '../app-featured';
import { AppWidgetSummary } from '../app-widget-summary';
import { AppCurrentDownload } from '../app-current-download';
// import { AppNewInvoice } from '../app-new-invoice';
// import { AppTopAuthors } from '../app-top-authors';
// import { AppTopRelated } from '../app-top-related';
// import { AppTopInstalledCountries } from '../app-top-installed-countries';
// import { _appAuthors, _appRelated, _appInvoices, _appInstalled } from 'src/_mock';

type DashboardStats = {
  totalSchools: number;
  totalGroups: number;
  totalAdmins: number;
  schoolsByGroup: Array<{ groupId: string | number; groupName: string; totalSchools: number }>;
  schoolsWithWebhook: number;
  schoolsWithoutWebhook: number;
  totalStudents: number;
  totalTeachers: number;
  totalEntriesOverdue: number;
  totalEntriesPending: number;
  totalEntriesReceived: number;
};

function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function OverviewAppView() {
  const { user } = useAuthContext();
  const theme = useTheme();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [schoolsRes, groupsRes, adminsRes] = await Promise.all([
          SchoolService.list(),
          GroupService.getAll(),
          AdminService.list(),
        ]);

        // /schools -> { schools, ...pagination }
        const schools: any[] = (schoolsRes as any)?.schools ?? [];
        const totalSchools = schools.length;

        // /group -> IGroupItem[]
        const groups: IGroupItem[] = Array.isArray(groupsRes) ? (groupsRes as IGroupItem[]) : [];
        const totalGroups = groups.length;

        // /admins -> { admins, count, ... }
        const totalAdmins =
          (adminsRes as any)?.count ??
          (Array.isArray((adminsRes as any)?.admins) ? (adminsRes as any).admins.length : 0);

        // agregados vindo dos counts da query do SchoolController._index
        const totalStudents = schools.reduce((acc, s) => acc + (Number(s.studentCount) || 0), 0);
        const totalTeachers = schools.reduce((acc, s) => acc + (Number(s.teacherCount) || 0), 0);
        const totalEntriesOverdue = schools.reduce(
          (acc, s) => acc + (Number(s.entryOverdueCount) || 0),
          0
        );
        const totalEntriesPending = schools.reduce(
          (acc, s) => acc + (Number(s.entryPendingCount) || 0),
          0
        );
        const totalEntriesReceived = schools.reduce(
          (acc, s) => acc + (Number(s.entryReceivedCount) || 0),
          0
        );

        // Escolas por grupo: usa group.groupSchool vindo da API
        const schoolsByGroup = (groups as any[])
          .map((g) => {
            const groupSchools = Array.isArray(g.groupSchool) ? g.groupSchool : [];
            return {
              groupId: g.id,
              groupName: g.name,
              totalSchools: groupSchools.length,
            };
          })
          .filter((g) => g.totalSchools > 0)
          .sort((a, b) => a.groupName.localeCompare(b.groupName));

        // Webhook "configurado" = escola com token Asaas e não em modo de homologação
        const schoolsWithWebhook = schools.filter(
          (s) => !!s.asaasToken && !s.asaasHomologationMode
        ).length;

        const schoolsWithoutWebhook = Math.max(totalSchools - schoolsWithWebhook, 0);

        const newStats: DashboardStats = {
          totalSchools,
          totalGroups,
          totalAdmins,
          schoolsByGroup,
          schoolsWithWebhook,
          schoolsWithoutWebhook,
          totalStudents,
          totalTeachers,
          totalEntriesOverdue,
          totalEntriesPending,
          totalEntriesReceived,
        };

        if (mounted) {
          setStats(newStats);
        }
      } catch (err: any) {
        console.error('Erro ao carregar dados do dashboard:', err);
        if (mounted) {
          setError(err?.message ?? 'Erro ao carregar dados do dashboard.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const welcomeDescription = useMemo(() => {
    const totalSchools = stats?.totalSchools ?? 0;
    const totalGroups = stats?.totalGroups ?? 0;
    const webhooks = stats?.schoolsWithWebhook ?? 0;
    const totalStudents = stats?.totalStudents ?? 0;

    const schoolsLabel = pluralize(totalSchools, 'escola', 'escolas');
    const groupsLabel = pluralize(totalGroups, 'grupo', 'grupos');
    const webhookLabel = pluralize(webhooks, 'escola com webhook', 'escolas com webhook');
    const studentsLabel = pluralize(totalStudents, 'aluno', 'alunos');

    if (loading) {
      return 'Carregando estatísticas das escolas, grupos e webhooks...';
    }

    return `No momento você tem ${totalSchools} ${schoolsLabel} cadastrada(s) em ${totalGroups} ${groupsLabel}, sendo ${webhooks} ${webhookLabel} configurada(s) e aproximadamente ${totalStudents} ${studentsLabel} ativos.`;
  }, [stats, loading]);

  // const totalSchools = stats?.totalSchools ?? 0;

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        {/* Boas-vindas */}
        <Grid xs={12} md={8}>
          <AppWelcome
            title={`Bem-vindo de volta 👋 \n ${user?.name ?? user?.email ?? 'Administrador'}`}
            description={welcomeDescription}
            img={<SeoIllustration hideBackground />}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  component={RouterLink}
                  href="/dashboard/schools"
                >
                  Ver escolas
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  component={RouterLink}
                  href="/dashboard/webhooks"
                >
                  Ver webhooks
                </Button>
              </Box>
            }
          />
        </Grid>

        {/* Destaques (mock) */}
        <Grid xs={12} md={4}>
          <AppFeatured list={_appFeatured} />
        </Grid>

        {/* Loading / erro gerais */}
        {loading && (
          <Grid xs={12}>
            <Box
              sx={{
                py: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <CircularProgress />
              <Typography variant="body1">Carregando estatísticas...</Typography>
            </Box>
          </Grid>
        )}

        {error && !loading && (
          <Grid xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {/* Resumo: escolas, grupos, admins */}
        <Grid xs={12} md={4}>
          <AppWidgetSummary
            title="Total de escolas"
            percent={0}
            total={stats?.totalSchools ?? 0}
            chart={{
              categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'],
              series: [15, 18, 12, 51, 68, 11, 39, 37],
            }}
          />
        </Grid>

        <Grid xs={12} md={4}>
          <AppWidgetSummary
            title="Total de grupos"
            percent={0}
            total={stats?.totalGroups ?? 0}
            chart={{
              colors: [theme.vars.palette.info.main],
              categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'],
              series: [20, 41, 63, 33, 28, 35, 50, 46],
            }}
          />
        </Grid>

        <Grid xs={12} md={4}>
          <AppWidgetSummary
            title="Total de administradores"
            percent={0}
            total={stats?.totalAdmins ?? 0}
            chart={{
              colors: [theme.vars.palette.error.main],
              categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'],
              series: [18, 19, 31, 8, 16, 37, 12, 33],
            }}
          />
        </Grid>

        {/* Webhooks em escolas + Escolas por grupo (linha de cima) */}
        <Grid xs={12} container spacing={3}>
          {/* Donut de webhooks */}
          <Grid xs={12} md={4}>
            <AppCurrentDownload
              title="Webhooks em escolas"
              subheader="Configuração de webhooks por escola"
              chart={{
                series: [
                  { label: 'Com webhook', value: stats?.schoolsWithWebhook ?? 0 },
                  { label: 'Sem webhook', value: stats?.schoolsWithoutWebhook ?? 0 },
                ],
              }}
            />
          </Grid>

          {/* Escolas por grupo (como estava antes) */}
          <Grid xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="Escolas por grupo"
                subheader="Distribuição de escolas entre os grupos cadastrados"
                action={
                  <Button size="small" component={RouterLink} href="/dashboard/groups">
                    Ver grupos
                  </Button>
                }
              />
              <CardContent>
                {stats && stats.schoolsByGroup.length > 0 ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Grupo</TableCell>
                        <TableCell align="right">Total de escolas</TableCell>
                        <TableCell align="right">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.schoolsByGroup.map((item) => (
                        <TableRow key={item.groupId} hover>
                          <TableCell>{item.groupName}</TableCell>
                          <TableCell align="right">{item.totalSchools}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              component={RouterLink}
                              href={`/dashboard/schools?groupId=${item.groupId}`}
                            >
                              Ver escolas
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma escola encontrada para exibir por grupo.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Linha de baixo: Total de escolas + dois widgets lado a lado */}
        <Grid xs={12} container spacing={3} sx={{ mt: 0 }} alignItems="stretch">
          {/* Total de escolas (esquerda) */}
          <Grid xs={12} md={4} sx={{ display: 'flex' }}>
            <Card sx={{ textAlign: 'center', py: 3, px: 2, width: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total de escolas
              </Typography>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                {stats?.totalSchools ?? 0}
              </Typography>

              <Button size="small" sx={{ mt: 2 }} component={RouterLink} href="/dashboard/webhooks">
                Gerenciar webhooks
              </Button>
            </Card>
          </Grid>

          {/* Escolas com webhook (centro) */}
          <Grid xs={12} md={4} sx={{ display: 'flex' }}>
            <AppWidget
              title="Escolas com webhook"
              total={stats?.schoolsWithWebhook ?? 0}
              icon="solar:user-rounded-bold"
              chart={{
                series:
                  stats && stats.totalSchools
                    ? Math.round((stats.schoolsWithWebhook / stats.totalSchools) * 100)
                    : 0,
              }}
              sx={{ flexGrow: 1 }}
            />
          </Grid>

          {/* Escolas sem webhook (direita) */}
          <Grid xs={12} md={4} sx={{ display: 'flex' }}>
            <AppWidget
              title="Escolas sem webhook"
              total={stats?.schoolsWithoutWebhook ?? 0}
              icon="fluent:mail-24-filled"
              chart={{
                series:
                  stats && stats.totalSchools
                    ? Math.round((stats.schoolsWithoutWebhook / stats.totalSchools) * 100)
                    : 0,
                colors: [theme.vars.palette.info.light, theme.vars.palette.info.main],
              }}
              sx={{
                flexGrow: 1,
                bgcolor: 'info.dark',
                [`& .${svgColorClasses.root}`]: { color: 'info.light' },
              }}
            />
          </Grid>
        </Grid>

        {/* Indicadores educacionais: alunos / professores / lançamentos */}
        <Grid xs={12} md={4}>
          <AppWidgetSummary
            title="Total de alunos"
            percent={0}
            total={stats?.totalStudents ?? 0}
            chart={{
              categories: [''],
              series: [100],
            }}
          />
        </Grid>

        <Grid xs={12} md={4}>
          <AppWidgetSummary
            title="Total de professores"
            percent={0}
            total={stats?.totalTeachers ?? 0}
            chart={{
              categories: [''],
              series: [100],
            }}
          />
        </Grid>

        <Grid xs={12} md={4}>
          <AppWidgetSummary
            title="Lançamentos (pendentes)"
            percent={0}
            total={stats?.totalEntriesPending ?? 0}
            chart={{
              categories: [''],
              series: [100],
            }}
          />
        </Grid>

        {/* BLOCO OPCIONAL: mocks comentados */}
        {/*
        <Grid xs={12} lg={8}>
          <AppNewInvoice
            title="New invoice"
            tableData={_appInvoices}
            headLabel={[
              { id: 'id', label: 'Invoice ID' },
              { id: 'category', label: 'Category' },
              { id: 'price', label: 'Price' },
              { id: 'status', label: 'Status' },
              { id: '' },
            ]}
          />
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <AppTopRelated title="Related applications" list={_appRelated} />
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <AppTopInstalledCountries title="Top installed countries" list={_appInstalled} />
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <AppTopAuthors title="Top authors" list={_appAuthors} />
        </Grid>
        */}
      </Grid>
    </DashboardContent>
  );
}

'use client';

import type { StudentTask } from 'src/utils/student-journey';
import type { DashboardStats } from 'src/types/services/dashboard-stats';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useRolePermissions } from 'src/hooks/use-role-permissions';

import { STORAGE_KEYS } from 'src/utils/axios';
import { fCurrency } from 'src/utils/format-number';
import { STUDENT_TASKS, studentSearchHref } from 'src/utils/student-journey';

import { DashboardContent } from 'src/layouts/dashboard';
import { DashboardService } from 'src/services/dashboard';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

export function SchoolDashboardView() {
  const { user } = useAuthContext();
  const { canCreateStudent, canManageTeachers, canCreateFinancial } = useRolePermissions();
  const router = useRouter();
  const canSeeFinancial = ['admin', 'employee', 'superAdmin'].includes(user?.role);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [task, setTask] = useState<StudentTask>('profile');
  const [searchError, setSearchError] = useState(false);
  const [schoolName, setSchoolName] = useState('Sua escola');
  const tasks = STUDENT_TASKS.filter((item) => item.id !== 'payments' || canSeeFinancial);
  useEffect(() => {
    const id = sessionStorage.getItem(STORAGE_KEYS.schoolId);
    const schools = (user?.schools ?? []) as { id: string; name: string }[];
    setSchoolName(
      schools.find((school) => school.id === id)?.name ?? schools[0]?.name ?? 'Sua escola'
    );
  }, [user]);
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setStats(await DashboardService.getStats(canSeeFinancial));
    } catch {
      setLoadError(true);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [canSeeFinancial]);
  useEffect(() => {
    void load();
  }, [load]);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (search.trim().length < 2) {
      setSearchError(true);
      event.currentTarget.querySelector<HTMLInputElement>('input')?.focus();
      return;
    }
    router.push(studentSearchHref(search, task));
  };
  return (
    <DashboardContent>
      <Stack spacing={4}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography component="h1" variant="h4">
              Atendimento da escola
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Olá, {user?.displayName ?? user?.name ?? 'equipe'}. Vamos começar pelo que você
              precisa resolver.
            </Typography>
          </Box>
          <Chip
            label={schoolName}
            variant="outlined"
            color="primary"
            icon={<Iconify icon="solar:buildings-2-bold-duotone" />}
            sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, maxWidth: '100%' }}
          />
        </Stack>
        <Card
          component="section"
          aria-labelledby="service-heading"
          sx={{
            p: { xs: 2.5, md: 4 },
            border: '1px solid',
            borderColor: 'primary.light',
            backgroundColor: 'background.paper',
            backgroundImage: (theme) =>
              `linear-gradient(125deg, rgba(${theme.vars.palette.primary.mainChannel}, 0.10), rgba(${theme.vars.palette.primary.mainChannel}, 0) 75%)`,
          }}
        >
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'primary.dark',
                  color: 'primary.contrastText',
                  borderRadius: 1.5,
                  width: 44,
                  height: 44,
                }}
              >
                <Iconify icon="solar:users-group-rounded-bold" width={25} />
              </Box>
              <Box>
                <Typography id="service-heading" variant="h5" component="h2">
                  O que você precisa fazer?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Escolha a tarefa e encontre o aluno. A ficha abre no lugar certo.
                </Typography>
              </Box>
            </Stack>
            <ToggleButtonGroup
              exclusive
              value={task}
              onChange={(_, value) => {
                if (value) setTask(value);
              }}
              aria-label="Motivo do atendimento"
              sx={{
                flexWrap: 'wrap',
                gap: 1,
                '& .MuiToggleButton-root': {
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '10px !important',
                  m: '0 !important',
                  px: 1.5,
                  minHeight: 42,
                  textTransform: 'none',
                  bgcolor: 'background.paper',
                  '&.Mui-selected': {
                    bgcolor: 'primary.dark',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                },
              }}
            >
              {tasks.map((item) => (
                <ToggleButton key={item.id} value={item.id}>
                  <Iconify icon={item.icon} width={18} sx={{ mr: 0.75 }} />
                  {item.title}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Box component="form" onSubmit={submit}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
                <TextField
                  fullWidth
                  label="Nome ou CPF do aluno"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSearchError(false);
                  }}
                  error={searchError}
                  helperText={
                    searchError
                      ? 'Digite pelo menos 2 caracteres para buscar.'
                      : 'A busca considera todos os status, inclusive interessados e alunos inativos.'
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'primary.dark',
                    '&:hover': { bgcolor: 'primary.darker' },
                    minHeight: 56,
                    whiteSpace: 'nowrap',
                    width: { xs: '100%', sm: 'auto' },
                    px: 3,
                  }}
                  endIcon={<Iconify icon="solar:arrow-right-linear" />}
                >
                  Encontrar aluno
                </Button>
              </Stack>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Button
                component={RouterLink}
                href={studentSearchHref('', task)}
                color="inherit"
                size="small"
              >
                Ver lista de alunos
              </Button>
              {canCreateStudent && (
                <Button
                  component={RouterLink}
                  href={paths.dashboard.students.new}
                  size="small"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                >
                  Cadastrar novo aluno
                </Button>
              )}
            </Stack>
          </Stack>
        </Card>
        <Box component="section" aria-labelledby="school-summary-heading">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography id="school-summary-heading" variant="h6" component="h2">
              Sua escola em números
            </Typography>
            <Button
              size="small"
              disabled={loading}
              onClick={load}
              startIcon={<Iconify icon="solar:refresh-bold" />}
            >
              Atualizar resumo
            </Button>
          </Stack>
          {loadError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" onClick={load}>
                  Tentar novamente
                </Button>
              }
            >
              Não foi possível carregar o resumo. Os valores estão indisponíveis; isso não significa
              saldo zero. Você pode continuar o atendimento pela busca acima.
            </Alert>
          )}
          <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr 1fr', md: 'repeat(4, 1fr)' }}
            gap={2}
            aria-busy={loading}
          >
            {[
              {
                title: 'Alunos',
                value: stats?.studentCount,
                href: paths.dashboard.students.root,
                icon: 'solar:users-group-rounded-bold',
              },
              {
                title: 'Professores',
                value: stats?.teacherCount,
                href: paths.dashboard.teachers.root,
                icon: 'solar:user-id-bold-duotone',
              },
              {
                title: 'Cursos',
                value: stats?.courseCount,
                href: paths.dashboard.courses.root,
                icon: 'solar:book-2-bold-duotone',
              },
              {
                title: 'Turmas',
                value: stats?.classroomCount,
                href: paths.dashboard.classrooms.root,
                icon: 'solar:calendar-mark-bold-duotone',
              },
            ].map((item) => (
              <Card
                key={item.title}
                component={RouterLink}
                href={item.href}
                sx={{
                  p: 2.5,
                  textDecoration: 'none',
                  color: 'text.primary',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { borderColor: 'primary.main' },
                  '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main' },
                }}
              >
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    {item.title}
                  </Typography>
                  <Iconify icon={item.icon} width={22} sx={{ color: 'primary.main' }} />
                </Stack>
                <Typography variant="h4" component="p" sx={{ mt: 1 }}>
                  {loading ? <Skeleton width={60} /> : (item.value ?? '—')}
                </Typography>
              </Card>
            ))}
          </Box>
        </Box>
        {canSeeFinancial && (
          <Box component="section" aria-labelledby="financial-summary-heading">
            <Typography id="financial-summary-heading" variant="h6" component="h2">
              Financeiro
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Valores de todos os períodos. Abra a lista para conferir os lançamentos antes de
              cobrar.
            </Typography>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }} gap={2}>
              {[
                {
                  title: 'Pendente',
                  value: stats?.totalPending,
                  color: 'warning.main',
                  status: 'Pendente',
                  icon: 'solar:clock-circle-bold-duotone',
                },
                {
                  title: 'Em atraso',
                  value: stats?.totalOverdue,
                  color: 'error.main',
                  status: 'Atrasado',
                  icon: 'solar:danger-triangle-bold-duotone',
                },
                {
                  title: 'Recebido',
                  value: stats?.totalReceived,
                  color: 'success.main',
                  status: 'Pago',
                  icon: 'solar:check-circle-bold-duotone',
                },
              ].map((item) => (
                <Card
                  key={item.title}
                  component={RouterLink}
                  href={`${paths.dashboard.financial.root}?status=${encodeURIComponent(item.status)}&year=all`}
                  sx={{
                    p: 2.5,
                    borderTop: '3px solid',
                    borderColor: item.color,
                    textDecoration: 'none',
                    color: 'text.primary',
                    '&:hover': { boxShadow: 6 },
                    '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main' },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {item.title}
                    </Typography>
                    <Iconify icon={item.icon} sx={{ color: item.color }} />
                  </Stack>
                  <Typography variant="h5" component="p" sx={{ mt: 1 }}>
                    {loading ? (
                      <Skeleton width={110} />
                    ) : item.value == null ? (
                      '—'
                    ) : (
                      fCurrency(item.value)
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Conferir lançamentos →
                  </Typography>
                </Card>
              ))}
            </Box>
          </Box>
        )}
        <Box component="section" aria-labelledby="organize-heading">
          <Typography id="organize-heading" variant="h6" component="h2" sx={{ mb: 2 }}>
            Organizar a escola
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Button
              component={RouterLink}
              href={paths.dashboard.classrooms.root}
              variant="outlined"
              color="inherit"
            >
              Consultar turmas
            </Button>
            <Button
              component={RouterLink}
              href={paths.dashboard.lessons.root}
              variant="outlined"
              color="inherit"
            >
              Aulas e chamada
            </Button>
            {canManageTeachers && (
              <Button
                component={RouterLink}
                href={paths.dashboard.teachers.new}
                variant="outlined"
                color="inherit"
              >
                Novo professor
              </Button>
            )}
            {canCreateFinancial && canSeeFinancial && (
              <Button
                component={RouterLink}
                href={paths.dashboard.financial.new}
                variant="outlined"
                color="inherit"
              >
                Novo lançamento
              </Button>
            )}
            <Button
              component={RouterLink}
              href={paths.dashboard.curriculum.root}
              variant="outlined"
              color="inherit"
            >
              Grade curricular
            </Button>
          </Stack>
        </Box>
      </Stack>
    </DashboardContent>
  );
}

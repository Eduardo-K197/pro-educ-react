'use client';

import { useState, useEffect } from 'react';

import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuthContext } from 'src/auth/hooks';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { fCurrency } from 'src/utils/format-number';

import { STORAGE_KEYS } from 'src/utils/axios';

import { DashboardService } from 'src/services/dashboard';
import type { DashboardStats } from 'src/types/services/dashboard-stats';

const EMPTY_STATS: DashboardStats = {
  studentCount: 0, teacherCount: 0, courseCount: 0, classroomCount: 0,
  totalPending: 0, totalOverdue: 0, totalReceived: 0,
};

// ----------------------------------------------------------------------

type StatCardProps = {
  title: string;
  value: number | string;
  icon: string;
  color?: string;
  href?: string;
};

function StatCard({ title, value, icon, color = 'primary.main', href }: StatCardProps) {
  const content = (
    <Card
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        transition: 'box-shadow 0.2s',
        ...(href && { cursor: 'pointer', '&:hover': { boxShadow: 6 } }),
      }}
    >
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          width: 56,
          height: 56,
          borderRadius: 1.5,
          bgcolor: `${color.split('.')[0]}.lighter`,
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} width={28} sx={{ color }} />
      </Stack>
      <Stack>
        <Typography variant="h4">{value}</Typography>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
      </Stack>
    </Card>
  );

  if (href) {
    return (
      <RouterLink href={href} style={{ textDecoration: 'none' }}>
        {content}
      </RouterLink>
    );
  }

  return content;
}

// ----------------------------------------------------------------------

export function SchoolDashboardView() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(STORAGE_KEYS.schoolId);
      setActiveSchoolId(stored ?? (user?.schools as any[])?.[0]?.id ?? null);
    }
  }, [user]);

  useEffect(() => {
    DashboardService.getStats()
      .then(setStats)
      .catch(() => setStats(EMPTY_STATS))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '60vh' }}>
          <CircularProgress />
        </Stack>
      </DashboardContent>
    );
  }

  const schools = (user?.schools as any[]) ?? [];
  const schoolName =
    schools.find((s: any) => s.id === activeSchoolId)?.name ??
    schools[0]?.name ??
    'Escola';

  return (
    <DashboardContent>
      <Stack sx={{ mb: { xs: 3, md: 5 } }}>
        <Typography variant="h4">Bem-vindo, {user?.displayName ?? user?.name}!</Typography>
        <Typography variant="body2" color="text.secondary">
          {schoolName}
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Alunos"
            value={stats.studentCount}
            icon="solar:users-group-rounded-bold"
            color="primary.main"
            href={paths.dashboard.students.root}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Professores"
            value={stats.teacherCount}
            icon="solar:user-id-bold-duotone"
            color="info.main"
            href={paths.dashboard.teachers.root}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Cursos"
            value={stats.courseCount}
            icon="solar:book-2-bold-duotone"
            color="success.main"
            href={paths.dashboard.courses.root}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Turmas"
            value={stats.classroomCount}
            icon="solar:calendar-mark-bold-duotone"
            color="warning.main"
            href={paths.dashboard.classrooms.root}
          />
        </Grid>

        {/* Financeiro */}
        <Grid xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Financeiro
          </Typography>
        </Grid>

        {[
          {
            label: 'Pendente',
            value: stats.totalPending,
            borderColor: 'warning.main',
            textColor: 'warning.dark',
            icon: 'solar:clock-circle-bold-duotone',
            iconColor: 'warning.light',
          },
          {
            label: 'Em atraso',
            value: stats.totalOverdue,
            borderColor: 'error.main',
            textColor: 'error.dark',
            icon: 'solar:danger-triangle-bold-duotone',
            iconColor: 'error.light',
          },
          {
            label: 'Recebido (ano)',
            value: stats.totalReceived,
            borderColor: 'success.main',
            textColor: 'success.dark',
            icon: 'solar:check-circle-bold-duotone',
            iconColor: 'success.light',
          },
        ].map((item) => (
          <Grid key={item.label} xs={12} sm={4}>
            <Card sx={{ p: 3, borderLeft: 4, borderColor: item.borderColor }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="h5" color={item.textColor}>
                    {fCurrency(item.value)}
                  </Typography>
                </Stack>
                <Iconify icon={item.icon} width={40} sx={{ color: item.iconColor }} />
              </Stack>
            </Card>
          </Grid>
        ))}

        {/* Atalhos */}
        <Grid xs={12}>
          <Typography variant="h6" sx={{ mb: 2, mt: 1 }}>
            Atalhos rápidos
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {[
              { label: 'Novo aluno', icon: 'mingcute:add-line', href: paths.dashboard.students.new },
              { label: 'Novo professor', icon: 'mingcute:add-line', href: paths.dashboard.teachers.new },
              { label: 'Novo curso', icon: 'mingcute:add-line', href: paths.dashboard.courses.new },
              { label: 'Nova turma', icon: 'mingcute:add-line', href: paths.dashboard.classrooms.new },
              { label: 'Nova aula', icon: 'mingcute:add-line', href: paths.dashboard.lessons.new },
              { label: 'Novo lançamento', icon: 'solar:dollar-minimalistic-bold', href: paths.dashboard.financial.new },
            ].map((item) => (
              <Button
                key={item.label}
                component={RouterLink}
                href={item.href}
                variant="soft"
                size="small"
                startIcon={<Iconify icon={item.icon} />}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}

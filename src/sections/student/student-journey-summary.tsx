'use client';

import type { StudentDetail } from 'src/types/services/student';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { STUDENT_TASKS } from 'src/utils/student-journey';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

export function StudentJourneySummary({
  student,
  onNavigate,
}: {
  student: StudentDetail;
  onNavigate: (tab: string, overview?: boolean) => void;
}) {
  const { user } = useAuthContext();
  const active = (student.subscriptions ?? []).filter(
    (subscription) => !subscription.deletedAt
  ).length;
  const isActive = ['ativo', 'active'].includes(String(student.status ?? '').toLowerCase());
  return (
    <Card
      sx={{
        p: { xs: 2, md: 2.5 },
        mb: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
      }}
    >
      <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" spacing={2.5}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            src={student.picture?.url ?? student.pictureUrl}
            sx={{ width: 48, height: 48, bgcolor: 'primary.lighter', color: 'primary.dark' }}
          >
            {student.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Label variant="soft" color={isActive ? 'success' : 'default'}>
                {student.status ?? 'Status não informado'}
              </Label>
              <Typography variant="caption" color="text.secondary">
                {active} matrícula(s) vinculada(s)
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.75, overflowWrap: 'anywhere' }}
            >
              {student.phoneNumber ?? student.phone ?? student.email ?? 'Contato não informado'}
            </Typography>
          </Box>
        </Stack>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', md: 'repeat(4, auto)' }} gap={1}>
          {STUDENT_TASKS.filter(
            (task) => task.id !== 'profile' && (task.id !== 'payments' || user?.role !== 'teacher')
          ).map((task) => (
            <Button
              key={task.id}
              variant="soft"
              color="inherit"
              onClick={() => onNavigate(task.tab, task.id === 'report')}
              startIcon={<Iconify icon={task.icon} width={18} />}
              sx={{ minHeight: 44, textAlign: 'left' }}
            >
              {task.id === 'materials'
                ? 'Materiais e certificados'
                : task.id === 'enrollment'
                  ? 'Matrículas'
                  : task.title}
            </Button>
          ))}
        </Box>
      </Stack>
    </Card>
  );
}

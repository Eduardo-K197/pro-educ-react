'use client';

import { useState, useEffect } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';

import { fDate } from 'src/utils/format-time';

import type { StudentDetail } from 'src/types/services/student';
import { StudentService } from 'src/services/student';

import { StudentGradesTab } from '../student-grades-tab';
import { StudentTurmasTab } from '../student-turmas-tab';
import { StudentPagamentosTab } from '../student-pagamentos-tab';
import { StudentDesempenhoTab } from '../student-desempenho-tab';

// ----------------------------------------------------------------------

function safeStr(val: unknown): string | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'string') return val || undefined;
  if (typeof val === 'object') {
    const parts = Object.values(val as Record<string, unknown>)
      .filter((v) => v !== null && v !== undefined && v !== '')
      .map(String);
    return parts.length ? parts.join(', ') : undefined;
  }
  return String(val) || undefined;
}

type Props = { id: string };

export function StudentDetailsView({ id }: Props) {
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

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

  if (!student) return null;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={student.name}
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Alunos', href: paths.dashboard.students.root },
          { name: student.name },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.students.edit(String(student.id))}
            variant="contained"
            startIcon={<Iconify icon="solar:pen-bold" />}
          >
            Editar
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Detalhes" />
        <Tab label="Turmas" />
        <Tab label="Notas" />
        <Tab label="Pagamentos" />
        <Tab label="Desempenho" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid xs={12} md={4}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Stack alignItems="center" spacing={2}>
                <Avatar
                  src={student.pictureUrl ?? undefined}
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'primary.lighter',
                    color: 'primary.main',
                    fontSize: 32,
                  }}
                >
                  {student.name.charAt(0).toUpperCase()}
                </Avatar>

                <Stack spacing={0.5}>
                  <Typography variant="subtitle1">{student.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {student.email ?? '-'}
                  </Typography>
                </Stack>

                <Label
                  variant="soft"
                  color={
                    student.status === 'active' || student.status === 'ativo'
                      ? 'success'
                      : 'default'
                  }
                >
                  {student.status ?? 'ativo'}
                </Label>
              </Stack>
            </Card>
          </Grid>

          <Grid xs={12} md={8}>
            <Stack spacing={3}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Informações pessoais
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {[
                        { label: 'Telefone', value: safeStr(student.phone) },
                        { label: 'Data de nascimento', value: student.birthDate ? fDate(student.birthDate) : undefined },
                        { label: 'Gênero', value: safeStr(student.gender) },
                        { label: 'CPF', value: safeStr(student.cpf) },
                        { label: 'RG', value: safeStr(student.rg) },
                        { label: 'Endereço', value: safeStr(student.address) },
                      ].map((item) => (
                        <TableRow key={item.label}>
                          <TableCell sx={{ color: 'text.secondary', width: 180, border: 0, py: 1 }}>
                            {item.label}
                          </TableCell>
                          <TableCell sx={{ border: 0, py: 1 }}>{item.value ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>

              {student.guardian && (
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Responsável
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        {[
                          { label: 'Nome', value: student.guardian.name },
                          { label: 'Telefone', value: student.guardian.phone ?? student.guardian.phoneNumber },
                          { label: 'E-mail', value: student.guardian.email },
                          { label: 'Parentesco', value: student.guardian.relationship },
                          { label: 'CPF', value: student.guardian.cpf },
                          { label: 'RG', value: student.guardian.rg },
                          ...(student.guardian.address
                            ? [{
                                label: 'Endereço',
                                value: [
                                  student.guardian.address.street,
                                  student.guardian.address.number,
                                  student.guardian.address.county,
                                  student.guardian.address.city,
                                  student.guardian.address.state,
                                  student.guardian.address.zipCode,
                                ].filter(Boolean).join(', ') || undefined,
                              }]
                            : []),
                        ].map((item) => (
                          <TableRow key={item.label}>
                            <TableCell sx={{ color: 'text.secondary', width: 180, border: 0, py: 1 }}>
                              {item.label}
                            </TableCell>
                            <TableCell sx={{ border: 0, py: 1 }}>{item.value ?? '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              )}

              {student.subscriptions && student.subscriptions.length > 0 && (
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Turmas matriculadas
                  </Typography>
                  <Stack spacing={1}>
                    {student.subscriptions.map((sub) => (
                      <Stack key={sub.id} direction="row" spacing={2} alignItems="center">
                        <Iconify icon="solar:calendar-mark-bold-duotone" width={18} />
                        <Typography variant="body2">
                          {sub.classroom?.name ?? '-'} — {sub.course?.name ?? '-'}
                        </Typography>
                        {sub.status && (
                          <Label variant="soft" color="success">
                            {sub.status}
                          </Label>
                        )}
                      </Stack>
                    ))}
                  </Stack>
                </Card>
              )}
            </Stack>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && <StudentTurmasTab studentId={student.id} />}

      {activeTab === 2 && (
        <StudentGradesTab studentId={student.id} subscriptions={student.subscriptions} />
      )}

      {activeTab === 3 && <StudentPagamentosTab studentId={student.id} />}

      {activeTab === 4 && <StudentDesempenhoTab studentId={student.id} />}
    </DashboardContent>
  );
}

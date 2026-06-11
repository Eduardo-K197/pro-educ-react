'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';

import { ClassroomService } from 'src/services/classroom';

// ----------------------------------------------------------------------

type Props = { id: string };

export function ClassroomDetailsView({ id }: Props) {
  const [classroom, setClassroom] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ClassroomService.getById(id)
      .then(setClassroom)
      .catch(() => toast.error('Erro ao carregar turma'))
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

  if (!classroom) return null;

  const students: any[] = (classroom.subscriptions ?? []).map((s: any) => s.student).filter(Boolean);
  const teachers: any[] = classroom.teachers ?? [];
  const classes: any[] = classroom.classes ?? [];
  const vagas = classroom.maxStudentCount != null
    ? classroom.maxStudentCount - students.length
    : null;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={classroom.name}
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Turmas', href: paths.dashboard.classrooms.root },
          { name: classroom.name },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.classrooms.edit(id)}
            variant="contained"
            startIcon={<Iconify icon="solar:pen-bold" />}
          >
            Editar
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        {/* Resumo */}
        <Grid xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Informações da turma</Typography>
              <Divider />

              {classroom.course && (
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">Curso</Typography>
                  <Chip label={classroom.course.name} size="small" color="primary" sx={{ alignSelf: 'flex-start' }} />
                </Stack>
              )}

              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                <Stack spacing={0.5} alignItems="center" sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
                  <Typography variant="h4">{students.length}</Typography>
                  <Typography variant="caption" color="text.secondary">Alunos</Typography>
                </Stack>

                <Stack spacing={0.5} alignItems="center" sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
                  <Typography variant="h4">{teachers.length}</Typography>
                  <Typography variant="caption" color="text.secondary">Professores</Typography>
                </Stack>

                <Stack spacing={0.5} alignItems="center" sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
                  <Typography variant="h4">{classes.length}</Typography>
                  <Typography variant="caption" color="text.secondary">Aulas</Typography>
                </Stack>

                {classroom.maxStudentCount != null && (
                  <Stack spacing={0.5} alignItems="center" sx={{ p: 1.5, borderRadius: 1, bgcolor: vagas! > 0 ? 'success.lighter' : 'error.lighter' }}>
                    <Typography variant="h4" color={vagas! > 0 ? 'success.dark' : 'error.dark'}>
                      {vagas! > 0 ? vagas : 'Lotada'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Vagas</Typography>
                  </Stack>
                )}
              </Box>

              {teachers.length > 0 && (
                <>
                  <Divider />
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Professores</Typography>
                    {teachers.map((t: any) => (
                      <Stack key={t.id} direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                          {t.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">{t.name}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </>
              )}
            </Stack>
          </Card>
        </Grid>

        {/* Alunos matriculados */}
        <Grid xs={12} md={8}>
          <Card>
            <Stack sx={{ p: 3, pb: 1 }}>
              <Typography variant="h6">
                Alunos matriculados{' '}
                <Typography component="span" variant="body2" color="text.secondary">
                  ({students.length})
                </Typography>
              </Typography>
            </Stack>

            {students.length === 0 ? (
              <Stack alignItems="center" sx={{ py: 5 }}>
                <Iconify icon="solar:users-group-rounded-bold" width={48} sx={{ color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Nenhum aluno matriculado
                </Typography>
              </Stack>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Aluno</TableCell>
                      <TableCell>E-mail</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Ação</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student: any) => (
                      <TableRow key={student.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>
                              {student.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>
                              {student.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {student.email ?? '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Label
                            variant="soft"
                            color={
                              student.status === 'Ativo' ? 'success' :
                              student.status === 'Cancelado' ? 'error' : 'default'
                            }
                          >
                            {student.status ?? 'Ativo'}
                          </Label>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            component={RouterLink}
                            href={paths.dashboard.students.details(String(student.id))}
                          >
                            Ver aluno
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}

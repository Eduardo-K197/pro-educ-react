'use client';

import type { StudentDetail } from 'src/types/services/student';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import Grid from '@mui/material/Unstable_Grid2';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';
import { STUDENT_TABS, studentTabIndex } from 'src/utils/student-journey';

import { StudentService } from 'src/services/student';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { StudentGradesTab } from '../student-grades-tab';
import { StudentTurmasTab } from '../student-turmas-tab';
import { StudentPagamentosTab } from '../student-pagamentos-tab';
import { StudentDesempenhoTab } from '../student-desempenho-tab';
import { StudentJourneySummary } from '../student-journey-summary';

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = studentTabIndex(searchParams.get('tab'));
  const [revision, setRevision] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const navigateTab = (tab: string, overview = false) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set('tab', tab);
    if (overview) query.set('view', 'overview'); else query.delete('view');
    router.replace(`${pathname}?${query}`, { scroll: false });
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError(false); setStudent(null);
    StudentService.getById(id, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setStudent(data); })
      .catch(() => { if (!controller.signal.aborted) setLoadError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, revision]);

  if (loading) {
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '50vh' }}>
          <CircularProgress />
        </Stack>
      </DashboardContent>
    );
  }

  if (!student || loadError) return <DashboardContent><Alert severity="error" action={<Button color="inherit" onClick={() => setRevision((value) => value + 1)}>Tentar novamente</Button>}>Não foi possível abrir a ficha do aluno. Tente novamente antes de continuar o atendimento.</Alert><Button component={RouterLink} href={paths.dashboard.students.root} sx={{ mt: 2, alignSelf: 'flex-start' }}>Voltar à lista de alunos</Button></DashboardContent>;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={student.name}
        description="Cadastro, matrículas, pagamentos e documentos reunidos na mesma ficha."
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

      <StudentJourneySummary student={student} onNavigate={navigateTab} />

      <Tabs
        value={activeTab}
        onChange={(_, value) => navigateTab(STUDENT_TABS[value])}
        variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile
        aria-label="Seções da ficha do aluno"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Detalhes" />
        <Tab label="Matrículas" />
        <Tab label="Notas" />
        <Tab label="Pagamentos" />
        <Tab label="Histórico" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid xs={12}>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3} alignItems="start">
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Informações pessoais
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {[
                        { label: 'Telefone', value: safeStr(student.phoneNumber ?? student.phone) },
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
            </Box>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && <StudentTurmasTab onChanged={() => setRevision((value) => value + 1)} studentId={student.id} />}

      {activeTab === 2 && (
        <StudentGradesTab initialView={searchParams.get('view') === 'overview' ? 'overview' : 'details'} onViewChange={(view) => { const query = new URLSearchParams(searchParams.toString()); query.set('view', view); router.replace(`${pathname}?${query}`, { scroll: false }); }} studentId={student.id} subscriptions={student.subscriptions} />
      )}

      {activeTab === 3 && <StudentPagamentosTab studentId={student.id} />}

      {activeTab === 4 && <StudentDesempenhoTab studentId={student.id} />}
    </DashboardContent>
  );
}

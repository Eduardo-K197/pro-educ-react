'use client';

import type { StudentDetail } from 'src/types/services/student';

import { Suspense, useState, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useSearchParams } from 'src/routes/hooks';

import { GrowthService } from 'src/services/growth';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { StudentNewEditForm } from '../student-new-edit-form';

import type { StudentFormPrefill } from '../student-new-edit-form';

// ----------------------------------------------------------------------

/** Parâmetro usado pelo CRM (conversão de lead em matrícula). */
const CRM_DEAL_PARAM = 'crmDeal';

export function StudentCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Novo aluno"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Alunos', href: paths.dashboard.students.root },
          { name: 'Novo aluno' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <Suspense fallback={<CircularProgress sx={{ display: 'block', mx: 'auto', my: 8 }} />}>
        <CreateForm />
      </Suspense>
    </DashboardContent>
  );
}

function CreateForm() {
  const searchParams = useSearchParams();
  const dealId = searchParams.get(CRM_DEAL_PARAM);
  const [ready, setReady] = useState(!dealId);
  const [lead, setLead] = useState<{ title: string; prefill: StudentFormPrefill } | null>(null);

  useEffect(() => {
    if (!dealId) return;
    GrowthService.getDeal(dealId)
      .then(({ deal }) => {
        if (deal.convertedStudentId) {
          toast.warning('Este lead já foi convertido em matrícula.');
          return;
        }
        setLead({
          title: deal.title,
          prefill: {
            name: deal.studentName ?? '',
            birthDate: deal.studentBirthDate?.slice(0, 10) ?? '',
            guardianName: deal.guardianName ?? '',
            guardianPhone: deal.guardianPhone ?? '',
            guardianEmail: deal.guardianEmail ?? '',
            additionalInformation: [deal.interestLabel ? `Interesse: ${deal.interestLabel}` : null, deal.description].filter(Boolean).join('\n'),
          },
        });
      })
      .catch((err) => toast.error(err?.message || 'Não foi possível carregar o lead do CRM; o cadastro segue em branco.'))
      .finally(() => setReady(true));
  }, [dealId]);

  if (!ready) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 8 }} />;

  const onCreated =
    lead && dealId
      ? async (student: StudentDetail) => {
          await GrowthService.convertDeal(dealId, student.id);
          toast.success('Lead marcado como matriculado no CRM.');
          return paths.dashboard.students.details(String(student.id));
        }
      : undefined;

  return (
    <>
      {lead && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Cadastro a partir do lead &quot;{lead.title}&quot; do CRM. Confira os dados; ao salvar, o lead vai para a etapa de ganho. Depois inclua o aluno na
          turma pela ficha dele.
        </Alert>
      )}
      <StudentNewEditForm prefill={lead?.prefill} onCreated={onCreated} />
    </>
  );
}

'use client';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useSchoolModules } from 'src/hooks/use-school-modules';

import { DashboardContent } from 'src/layouts/dashboard';

import { EmptyContent } from 'src/components/empty-content';

import { CRM_AI_MODULE_LABEL } from 'src/types/services/crm-ai';

// ----------------------------------------------------------------------

/** Rotas /dashboard/intelligence* só com os módulos CRM e ProEduc Intelligence contratados. */
export function IntelligenceModuleGate({ children }: { children: React.ReactNode }) {
  const { modules, loading } = useSchoolModules();

  if (loading) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!modules.crm || !modules.intelligence) {
    return (
      <DashboardContent>
        <EmptyContent
          filled
          title={`${CRM_AI_MODULE_LABEL} não contratado`}
          description={
            modules.crm
              ? `O ${CRM_AI_MODULE_LABEL} (IA no atendimento) é um módulo adicional. Fale com o suporte do ProEduc para contratar e ativar para esta escola.`
              : `O ${CRM_AI_MODULE_LABEL} funciona junto com o módulo CRM. Fale com o suporte do ProEduc para contratar e ativar os dois para esta escola.`
          }
          sx={{ py: 10 }}
        />
      </DashboardContent>
    );
  }

  return <>{children}</>;
}

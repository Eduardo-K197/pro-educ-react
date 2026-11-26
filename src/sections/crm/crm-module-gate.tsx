'use client';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useSchoolModules } from 'src/hooks/use-school-modules';

import { DashboardContent } from 'src/layouts/dashboard';

import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

/** Rotas /dashboard/crm* só com o módulo CRM contratado pela escola. */
export function CrmModuleGate({ children }: { children: React.ReactNode }) {
  const { modules, loading } = useSchoolModules();

  if (loading) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!modules.crm) {
    return (
      <DashboardContent>
        <EmptyContent
          filled
          title="Módulo CRM não contratado"
          description="O atendimento por WhatsApp (CRM) é um módulo adicional. Fale com o suporte do ProEduc para contratar e ativar para esta escola."
          sx={{ py: 10 }}
        />
      </DashboardContent>
    );
  }

  return <>{children}</>;
}

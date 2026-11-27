'use client';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useSchoolModules } from 'src/hooks/use-school-modules';

import { DashboardContent } from 'src/layouts/dashboard';

import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

/** Rotas /dashboard/learning* só com o módulo ProEduc Learning contratado pela escola. */
export function LearningModuleGate({ children }: { children: React.ReactNode }) {
  const { modules, loading } = useSchoolModules();

  if (loading) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!modules.learning) {
    return (
      <DashboardContent>
        <EmptyContent
          filled
          title="ProEduc Learning não contratado"
          description="Videoaulas, materiais e a área do aluno fazem parte do módulo ProEduc Learning. Fale com o suporte do ProEduc para contratar e ativar para esta escola."
          sx={{ py: 10 }}
        />
      </DashboardContent>
    );
  }

  return <>{children}</>;
}

'use client';

import type { CrmRole } from 'src/types/services/crm';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { hasCrmRole } from 'src/hooks/use-crm-permission';

import { EmptyContent } from 'src/components/empty-content';

import { CRM_ROLE_LABELS } from 'src/types/services/crm';

import { useCrmAccess } from './crm-access-context';

// ----------------------------------------------------------------------

type Props = {
  min: CrmRole;
  children: React.ReactNode;
};

/** Mostra o conteúdo apenas para quem tem o papel CRM mínimo na escola atual. */
export function CrmAccessGuard({ min, children }: Props) {
  const { me, loading, error, reload } = useCrmAccess();

  if (loading) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 8 }} />;
  }

  if (error) {
    return (
      <EmptyContent
        filled
        title="Não foi possível carregar o CRM"
        description={error}
        action={
          <Button variant="outlined" sx={{ mt: 2 }} onClick={reload}>
            Tentar novamente
          </Button>
        }
        sx={{ py: 10 }}
      />
    );
  }

  if (!hasCrmRole(me?.role, min)) {
    return (
      <EmptyContent
        filled
        title="Acesso restrito"
        description={
          me?.role
            ? `Esta área exige o papel ${CRM_ROLE_LABELS[min]} no CRM.`
            : 'Você ainda não faz parte da equipe de atendimento desta escola. Peça a um gestor para incluí-lo.'
        }
        sx={{ py: 10 }}
      />
    );
  }

  return <>{children}</>;
}

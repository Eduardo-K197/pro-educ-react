'use client';

import { useContext, createContext } from 'react';

import { useCrmPermission } from 'src/hooks/use-crm-permission';

// ----------------------------------------------------------------------

type CrmAccessValue = ReturnType<typeof useCrmPermission>;

const CrmAccessContext = createContext<CrmAccessValue | undefined>(undefined);

/** Consulta GET /crm/me uma vez para todas as telas do módulo. */
export function CrmAccessProvider({ children }: { children: React.ReactNode }) {
  const value = useCrmPermission();
  return <CrmAccessContext.Provider value={value}>{children}</CrmAccessContext.Provider>;
}

export function useCrmAccess() {
  const context = useContext(CrmAccessContext);
  if (!context) throw new Error('useCrmAccess deve ser usado dentro de CrmAccessProvider');
  return context;
}

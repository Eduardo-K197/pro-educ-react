'use client';

import { CrmSocketProvider } from 'src/lib/socket';

import { useCrmAccess, CrmAccessProvider } from './crm-access-context';

// ----------------------------------------------------------------------

function SocketForMembers({ children }: { children: React.ReactNode }) {
  const { me } = useCrmAccess();
  return <CrmSocketProvider enabled={!!me?.permissions.access}>{children}</CrmSocketProvider>;
}

/** Providers do módulo CRM: permissão (GET /crm/me) e socket (só para quem tem acesso). */
export function CrmLayoutProviders({ children }: { children: React.ReactNode }) {
  return (
    <CrmAccessProvider>
      <SocketForMembers>{children}</SocketForMembers>
    </CrmAccessProvider>
  );
}

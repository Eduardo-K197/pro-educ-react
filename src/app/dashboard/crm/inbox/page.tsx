import type { Metadata } from 'next';

import { CrmInboxView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM - Atendimento' };

export default function Page() {
  return <CrmInboxView />;
}

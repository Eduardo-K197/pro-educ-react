import type { Metadata } from 'next';

import { CrmTaskListView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM - Minhas tarefas' };

export default function Page() {
  return <CrmTaskListView />;
}

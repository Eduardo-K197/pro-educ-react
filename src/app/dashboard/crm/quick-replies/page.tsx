import type { Metadata } from 'next';

import { CrmQuickReplyListView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM - Respostas rápidas' };

export default function Page() {
  return <CrmQuickReplyListView />;
}

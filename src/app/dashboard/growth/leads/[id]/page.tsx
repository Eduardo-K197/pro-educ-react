import type { Metadata } from 'next';

import { CrmLeadDetailsView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM - Lead' };

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <CrmLeadDetailsView id={params.id} />;
}

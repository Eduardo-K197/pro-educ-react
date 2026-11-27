import type { Metadata } from 'next';

import { CrmCampaignDetailsView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM - Campanha' };

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <CrmCampaignDetailsView id={params.id} />;
}

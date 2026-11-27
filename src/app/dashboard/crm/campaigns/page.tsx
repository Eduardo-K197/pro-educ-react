import type { Metadata } from 'next';

import { CrmCampaignListView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM - Campanhas' };

export default function Page() {
  return <CrmCampaignListView />;
}

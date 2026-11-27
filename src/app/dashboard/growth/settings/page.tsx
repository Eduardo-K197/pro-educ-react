import type { Metadata } from 'next';

import { CrmPipelineConfigView } from 'src/sections/crm/view';

export const metadata: Metadata = { title: 'CRM - Etapas do funil' };

export default function Page() {
  return <CrmPipelineConfigView />;
}

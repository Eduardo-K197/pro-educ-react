import type { Metadata } from 'next';

import { GrowthLeadDetailsView } from 'src/sections/growth/view';

export const metadata: Metadata = { title: 'Growth - Lead' };

type Props = { params: { id: string } };

export default function Page({ params }: Props) {
  return <GrowthLeadDetailsView id={params.id} />;
}

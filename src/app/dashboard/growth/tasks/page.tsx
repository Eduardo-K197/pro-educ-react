import type { Metadata } from 'next';

import { GrowthTaskListView } from 'src/sections/growth/view';

export const metadata: Metadata = { title: 'Growth - Tarefas' };

export default function Page() {
  return <GrowthTaskListView />;
}

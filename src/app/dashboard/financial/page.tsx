import type { Metadata } from 'next';
import { FinancialListView } from 'src/sections/financial/view';

export const metadata: Metadata = { title: 'Financeiro' };

export default function Page() {
  return <FinancialListView />;
}

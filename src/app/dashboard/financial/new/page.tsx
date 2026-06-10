import type { Metadata } from 'next';
import { FinancialCreateView } from 'src/sections/financial/view';

export const metadata: Metadata = { title: 'Novo lançamento' };

export default function Page() {
  return <FinancialCreateView />;
}

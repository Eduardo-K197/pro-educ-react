import { CrmAccessProvider } from 'src/sections/crm/crm-access-context';
import { IntelligenceModuleGate } from 'src/sections/intelligence/intelligence-module-gate';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

/** Rotas da escola (grupo (escola)): mesmo esquema do CRM: gate de módulo (crm + intelligence) e papel do usuário (GET /crm/me). */
export default function Layout({ children }: Props) {
  return (
    <IntelligenceModuleGate>
      <CrmAccessProvider>{children}</CrmAccessProvider>
    </IntelligenceModuleGate>
  );
}

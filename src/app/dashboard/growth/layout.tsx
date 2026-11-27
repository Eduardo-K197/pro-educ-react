import { GrowthModuleGate } from 'src/sections/growth/growth-module-gate';
import { CrmLayoutProviders } from 'src/sections/crm/crm-layout-providers';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

/** Growth usa a mesma equipe/papéis e o mesmo socket do CRM (GET /crm/me aceita ChatFlow ou Growth). */
export default function Layout({ children }: Props) {
  return (
    <GrowthModuleGate>
      <CrmLayoutProviders>{children}</CrmLayoutProviders>
    </GrowthModuleGate>
  );
}

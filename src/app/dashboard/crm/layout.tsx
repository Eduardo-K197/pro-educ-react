import { CrmLayoutProviders } from 'src/sections/crm/crm-layout-providers';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return <CrmLayoutProviders>{children}</CrmLayoutProviders>;
}

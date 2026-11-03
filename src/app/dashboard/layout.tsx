import { CONFIG } from 'src/config-global';
import { RoleAwareDashboardLayout } from 'src/layouts/dashboard/role-aware-layout';

import { AuthGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  if (CONFIG.auth.skip) {
    return <RoleAwareDashboardLayout>{children}</RoleAwareDashboardLayout>;
  }

  return (
    <AuthGuard>
      <RoleAwareDashboardLayout>{children}</RoleAwareDashboardLayout>
    </AuthGuard>
  );
}

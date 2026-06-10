import { CONFIG } from 'src/config-global';

import { AuthGuard } from 'src/auth/guard';
import { RoleAwareDashboardLayout } from 'src/layouts/dashboard/role-aware-layout';

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

import { CONFIG } from 'src/config-global';
import { SchoolOrAdminDashboard } from 'src/sections/overview/app/view/school-or-admin-dashboard';

export const metadata = { title: `Painel — ${CONFIG.appName}` };

export default function Page() {
  return <SchoolOrAdminDashboard />;
}

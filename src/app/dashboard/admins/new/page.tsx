import { AdminCreateView } from '@/sections/admin/view';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

export const metadata = { title: `Create a new admin | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <AdminCreateView />;
}

import { CONFIG } from 'src/config-global';

import { AdminListView } from 'src/sections/admin/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Admin list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <AdminListView />;
}

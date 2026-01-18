import { _jobs } from 'src/_mock/_job';
import { CONFIG } from 'src/config-global';

import { AdminEditView } from 'src/sections/admin/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Admin edit | Dashboard - ${CONFIG.appName}` };

type Props = {
  params: { id: string };
};

export default function Page({ params }: Props) {
  const { id } = params;

  return <AdminEditView id={id}/>;
}

// ----------------------------------------------------------------------

/**
 * [1] Default
 * Remove [1] and [2] if not using [2]
 */
const dynamic = CONFIG.isStaticExport ? 'auto' : 'force-dynamic';

export { dynamic };
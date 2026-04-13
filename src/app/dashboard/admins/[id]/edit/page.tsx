import { CONFIG } from 'src/config-global';
import { AdminEditView } from 'src/sections/admin/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Editar administrador | Dashboard - ${CONFIG.appName}` };

type Props = {
  params: { id: string };
};

export default function Page({ params }: Props) {
  // A view `AdminEditView` carrega os dados do administrador via `useParams()` internamente.
  return <AdminEditView />;
}

// ----------------------------------------------------------------------

/**
 * [1] Default
 * Remove [1] and [2] if not using [2]
 */
const dynamic = CONFIG.isStaticExport ? 'auto' : 'force-dynamic';

export { dynamic };

import { CONFIG } from 'src/config-global';

import { JwtChangePasswordView } from 'src/auth/view/jwt';

// ----------------------------------------------------------------------

export const metadata = { title: `Criar senha | ${CONFIG.appName}` };

export default function Page() {
  return <JwtChangePasswordView />;
}

import { CONFIG } from 'src/config-global';

import { JwtSignInView } from 'src/auth/view/jwt';

// ----------------------------------------------------------------------

export const metadata = { title: `Entrar | Jwt - ${CONFIG.appName}` };

export default function Page() {
  return <JwtSignInView />;
}

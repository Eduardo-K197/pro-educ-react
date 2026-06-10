import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const navData = [
  { title: 'Início', path: '/', icon: <Iconify width={22} icon="solar:home-2-bold-duotone" /> },
  {
    title: 'Acesso',
    path: CONFIG.auth.redirectPath,
    icon: <Iconify width={22} icon="solar:login-2-bold-duotone" />,
  },
];

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const navData = [
  { title: 'Início', path: '/', icon: <Iconify width={22} icon="solar:home-2-bold-duotone" /> },
  {
    title: 'Produto',
    path: '/produto',
    icon: <Iconify width={22} icon="solar:widget-2-bold-duotone" />,
    children: [
      {
        subheader: 'ProEduc',
        items: [
          { title: 'Sobre', path: paths.about },
          { title: 'Planos', path: paths.pricing },
          { title: 'Dúvidas (FAQ)', path: paths.faqs },
          { title: 'Contato', path: paths.contact },
        ],
      },
      {
        subheader: 'Acesso',
        items: [{ title: 'Entrar', path: CONFIG.auth.redirectPath }],
      },
    ],
  },
];

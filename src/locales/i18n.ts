import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBRNavbar from 'src/locales/langs/pt-BR/navbar.json';
import enNavbar from './langs/en/navbar.json';

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { navbar: ptBRNavbar },
    en: { navbar: enNavbar },
  },
  lng: 'pt-BR', // idioma inicial
  fallbackLng: 'pt-BR', // fallback em pt-BR
  supportedLngs: ['en', 'pt-BR'],
  interpolation: { escapeValue: false },
  defaultNS: 'navbar',
});

export default i18n;

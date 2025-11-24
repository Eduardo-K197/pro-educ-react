'use client';

import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useRouter } from 'src/routes/hooks';
import { toast } from 'src/components/snackbar';

import { allLangs } from './all-langs';
import { fallbackLng, changeLangMessages as messages } from './config-locales';

import type { LanguageValue } from './config-locales';

export function useTranslate(ns?: string) {
  const router = useRouter();

  const { t, i18n } = useTranslation(ns);

  const fallback = allLangs.filter((lang) => lang.value === fallbackLng)[0];
  const currentLang = allLangs.find((lang) => lang.value === i18n.resolvedLanguage);

  const onChangeLang = useCallback(
    async (newLang: LanguageValue) => {
      try {
        const langChangePromise = i18n.changeLanguage(newLang);
        const currentMessages = messages[newLang] || messages.en;

        toast.promise(langChangePromise, {
          loading: currentMessages.loading,
          success: () => currentMessages.success,
          error: currentMessages.error,
        });

        // aplica o locale do idioma escolhido (NEW) e não o atual
        const nextLang = allLangs.find((l) => l.value === newLang) ?? fallback;
        if (nextLang?.adapterLocale) {
          dayjs.locale(nextLang.adapterLocale); // ex.: 'pt-br'
        }

        router.refresh();
      } catch (error) {
        console.error(error);
      }
    },
    [fallback, i18n, router]
  );

  return {
    t,
    i18n,
    onChangeLang,
    currentLang: currentLang ?? fallback,
  };
}

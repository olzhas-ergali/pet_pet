import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ru from './locales/ru.json';
import en from './locales/en.json';
import kk from './locales/kk.json';

export const SUPPORTED_LANGUAGES = ['kk', 'ru', 'en'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  kk: { translation: kk },
  ru: { translation: ru },
  en: { translation: en },
} as const;

i18n.use(LanguageDetector).use(initReactI18next).init({
    resources,
    /** kk → недостающие ключи из ru; en → сначала en, затем ru; остальное → ru */
    fallbackLng: {
      kk: ['ru'],
      en: ['en', 'ru'],
      default: ['ru'],
    },
    supportedLngs: [...SUPPORTED_LANGUAGES],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'optbirja-lang',
    },
  });

i18n.on('languageChanged', (lng) => {
  const base = lng.split('-')[0] ?? 'ru';
  if (SUPPORTED_LANGUAGES.includes(base as AppLanguage)) {
    document.documentElement.lang = base;
  }
  document.documentElement.dir = 'ltr';
});

const initial = i18n.resolvedLanguage?.split('-')[0] ?? 'ru';
document.documentElement.lang = initial;

export default i18n;

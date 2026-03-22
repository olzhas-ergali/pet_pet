import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import type { DetectorOptions } from 'i18next-browser-languagedetector';

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

/** Первый сегмент URL /en/... — приоритетнее localStorage при первой загрузке. */
const pathSegmentDetector = {
  name: 'pathSegment',
  lookup(_options: DetectorOptions): string | undefined {
    if (typeof window === 'undefined') return undefined;
    const seg = window.location.pathname.split('/').filter(Boolean)[0];
    if (seg && (SUPPORTED_LANGUAGES as readonly string[]).includes(seg)) {
      return seg;
    }
    return undefined;
  },
  cacheUserLanguage() {},
};

const languageDetector = new LanguageDetector();
languageDetector.addDetector(pathSegmentDetector);

i18n.use(languageDetector).use(initReactI18next).init({
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
      order: ['pathSegment', 'localStorage', 'navigator'],
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

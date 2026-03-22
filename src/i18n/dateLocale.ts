import type { Locale } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

/** date-fns: kk пока как ru (как в спецификации) */
export function getDateFnsLocale(lang: string): Locale {
  const base = lang.split('-')[0] ?? 'ru';
  if (base === 'en') return enUS;
  return ru;
}

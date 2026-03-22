import { stripLangFromPath } from '@/i18n/langRouting';

/**
 * Куда вести после успешного входа (из `location.state.from.pathname`).
 * Всегда возвращает путь с префиксом языка (`/{lang}/…`), в т.ч. дефолт `/${lang}/market`.
 * Старые непрефиксные пути (`/checkout`) нормализуются в `/${lang}/checkout`.
 * Единственный вызов: `Auth.tsx` — передавайте `routeLang` из URL (`useRouteLang()`).
 */
export function getPostLoginDestination(
  fromPath?: string | null,
  lang: string = 'ru',
): string {
  if (fromPath && fromPath.length > 0) {
    const core = stripLangFromPath(fromPath);
    if (core !== '/auth' && core !== '/') {
      if (/^\/(kk|ru|en)(\/|$)/i.test(fromPath)) {
        return fromPath;
      }
      const tail = core.startsWith('/') ? core : `/${core}`;
      return `/${lang}${tail}`;
    }
  }
  return `/${lang}/market`;
}

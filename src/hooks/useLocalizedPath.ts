import { useCallback } from 'react';
import { useLocation, useParams } from 'react-router';
import {
  DEFAULT_ROUTE_LANG,
  isRouteLang,
  withLangPath,
  type RouteLang,
} from '@/i18n/langRouting';

/** Язык из `/:lang/…`; при отсутствии/невалидном param — из pathname; иначе ru. */
export function useRouteLang(): RouteLang {
  const { lang } = useParams<{ lang: string }>();
  const { pathname } = useLocation();
  if (isRouteLang(lang)) {
    return lang.split('-')[0].toLowerCase() as RouteLang;
  }
  const m = pathname.match(/^\/(kk|ru|en)(?=\/|$)/i);
  if (m && isRouteLang(m[1])) {
    return m[1].toLowerCase() as RouteLang;
  }
  return DEFAULT_ROUTE_LANG;
}

/** Все <Link> и navigate внутри /:lang должны идти через эту функцию. */
export function useLocalizedPath() {
  const routeLang = useRouteLang();
  return useCallback((path: string) => withLangPath(routeLang, path), [routeLang]);
}

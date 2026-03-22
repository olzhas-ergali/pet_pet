import { useCallback } from 'react';
import { useParams } from 'react-router';
import {
  DEFAULT_ROUTE_LANG,
  isRouteLang,
  withLangPath,
  type RouteLang,
} from '@/i18n/langRouting';

export function useRouteLang(): RouteLang {
  const { lang } = useParams<{ lang: string }>();
  if (isRouteLang(lang)) {
    return lang.split('-')[0].toLowerCase() as RouteLang;
  }
  return DEFAULT_ROUTE_LANG;
}

/** Все <Link> и navigate внутри /:lang должны идти через эту функцию. */
export function useLocalizedPath() {
  const routeLang = useRouteLang();
  return useCallback((path: string) => withLangPath(routeLang, path), [routeLang]);
}

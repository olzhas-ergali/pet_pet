import { Navigate, useLocation } from 'react-router';
import {
  DEFAULT_ROUTE_LANG,
  SUPPORTED_LANGS,
  type RouteLang,
} from '@/i18n/langRouting';

function readPreferredLang(): RouteLang {
  try {
    const a = localStorage.getItem('optbirja-lang');
    const b = localStorage.getItem('i18nextLng');
    const raw = (a || b || '').replace(/^"|"$/g, '');
    const base = raw.split('-')[0]?.toLowerCase() ?? '';
    if ((SUPPORTED_LANGS as readonly string[]).includes(base)) {
      return base as RouteLang;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_ROUTE_LANG;
}

/**
 * Старые закладки без префикса (/catalog) → /{lang}/catalog.
 * Неизвестный путь при валидном префиксе → /{lang}/market.
 */
export function WildcardLangRedirect() {
  const location = useLocation();
  const { pathname, search } = location;
  const m = pathname.match(/^\/(kk|ru|en)(\/|$)/i);

  if (m) {
    const prefix = m[1].toLowerCase() as RouteLang;
    return <Navigate to={`/${prefix}/market${search}`} replace />;
  }

  const lang = readPreferredLang();
  return <Navigate to={`/${lang}${pathname}${search}`} replace />;
}

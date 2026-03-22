/** Префикс языка в URL: /ru/catalog, /en/auth */

export const SUPPORTED_LANGS = ['kk', 'ru', 'en'] as const;
export type RouteLang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_ROUTE_LANG: RouteLang = 'ru';

export function isRouteLang(s: string | undefined): s is RouteLang {
  if (!s) return false;
  const base = s.split('-')[0]?.toLowerCase() ?? '';
  return (SUPPORTED_LANGS as readonly string[]).includes(base);
}

/** /ru, /ru/catalog → /catalog; /catalog → /catalog */
export function stripLangFromPath(pathname: string): string {
  const trimmed = pathname.replace(/^\/(kk|ru|en)(?=\/|$)/i, '');
  if (trimmed === '') return '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/** Собрать путь с префиксом языка. path: "/catalog" или "/catalog?q=1" */
export function withLangPath(lang: RouteLang, path: string): string {
  const q = path.includes('?') ? path.split('?').slice(1).join('?') : '';
  const pathnameOnly = path.split('?')[0] || '/';
  const p = pathnameOnly.startsWith('/') ? pathnameOnly : `/${pathnameOnly}`;
  const core = p === '/' ? '' : p;
  const qs = q ? `?${q}` : '';
  return `/${lang}${core}${qs}`;
}

/** Текущий URL → тот же путь с другим языком (pathname + search). */
export function swapRouteLang(fullPath: string, newLang: RouteLang): string {
  const qIdx = fullPath.indexOf('?');
  const pathname = qIdx >= 0 ? fullPath.slice(0, qIdx) : fullPath;
  const search = qIdx >= 0 ? fullPath.slice(qIdx) : '';
  const core = stripLangFromPath(pathname);
  return withLangPath(newLang, `${core}${search}`);
}

import { useLayoutEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  DEFAULT_ROUTE_LANG,
  SUPPORTED_LANGS,
  type RouteLang,
} from '@/i18n/langRouting';

/** Синхронно читает localStorage; не зависит от рендера — вызывать один раз при маунте маршрута `/`. */
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

/** `/` → `/{lang}` по сохранённому языку или ru */
export function RootRedirect() {
  const navigate = useNavigate();
  const target = useMemo(() => `/${readPreferredLang()}`, []);
  useLayoutEffect(() => {
    navigate(target, { replace: true });
  }, [navigate, target]);
  return null;
}

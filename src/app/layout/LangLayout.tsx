import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { DEFAULT_ROUTE_LANG, isRouteLang, type RouteLang } from '@/i18n/langRouting';
import { applySeoMeta } from '@/lib/seoTitles';
import { track } from '@/lib/analytics';

/** Валидирует :lang, синхронизирует i18next с URL. */
export function LangLayout() {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();
  const { i18n: i18nFromHook } = useTranslation();

  if (!isRouteLang(lang)) {
    return <Navigate to={`/${DEFAULT_ROUTE_LANG}`} replace />;
  }

  const base = lang.split('-')[0].toLowerCase() as RouteLang;

  useEffect(() => {
    void i18n.changeLanguage(base);
  }, [base]);

  useEffect(() => {
    applySeoMeta(i18nFromHook.t, location.pathname);
  }, [i18nFromHook, location.pathname, base]);

  useEffect(() => {
    track('page_view', { lang: base, path: location.pathname });
  }, [base, location.pathname]);

  return <Outlet />;
}

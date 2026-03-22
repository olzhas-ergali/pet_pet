/** Публичный origin прод-сайта без завершающего слэша (canonical, sitemap). */
export function getPublicSiteBaseUrl(): string {
  const raw = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  if (raw?.trim()) {
    return raw.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

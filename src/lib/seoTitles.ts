import { stripLangFromPath } from '@/i18n/langRouting';
import type { TFunction } from 'i18next';
import { getPublicSiteBaseUrl } from '@/lib/siteBaseUrl';

/** Корневой путь (после снятия /ru|en|kk) → ключ i18n для <title>. */
export function seoTitleKeyForPath(pathname: string): string {
  const core = stripLangFromPath(pathname);
  if (core === '/' || core === '') return 'seo.titleHome';
  if (core.startsWith('/auth')) return 'seo.titleAuth';
  if (core.startsWith('/market')) return 'seo.titleMarket';
  if (core.startsWith('/catalog')) return 'seo.titleCatalog';
  if (core.startsWith('/product/')) return 'seo.titleProduct';
  if (core.startsWith('/cart')) return 'seo.titleCart';
  if (core.startsWith('/checkout')) return 'seo.titleCheckout';
  if (core.startsWith('/order-success')) return 'seo.titleOrderSuccess';
  if (core.startsWith('/profile/settings')) return 'seo.titleProfileSettings';
  if (core.startsWith('/profile')) return 'seo.titleProfile';
  if (core.startsWith('/supplier')) return 'seo.titleSupplier';
  if (core.startsWith('/admin')) return 'seo.titleAdmin';
  return 'seo.titleDefault';
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function canonicalHref(pathname: string): string {
  const base = getPublicSiteBaseUrl();
  const pathOnly = pathname.split('?')[0];
  if (base) {
    return `${base}${pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`}`;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${pathOnly}`;
  }
  return pathOnly;
}

export function applySeoMeta(t: TFunction, pathname: string) {
  if (typeof document === 'undefined') return;

  const title = t(seoTitleKeyForPath(pathname));
  document.title = title;

  const desc = t('seo.metaDescription');

  setMeta('description', desc);
  setMeta('og:title', title, 'property');
  setMeta('og:description', desc, 'property');
  setMeta('twitter:card', 'summary_large_image');

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', canonicalHref(pathname));
}

const MAX_PRODUCT_TITLE_LEN = 58;

/** После загрузки SKU: title + og:title + canonical (перекрывает общий ключ seo.titleProduct). */
export function applyProductDetailSeo(productName: string, pathname: string, t: TFunction) {
  if (typeof document === 'undefined') return;

  const short =
    productName.length > MAX_PRODUCT_TITLE_LEN
      ? `${productName.slice(0, MAX_PRODUCT_TITLE_LEN - 1)}…`
      : productName;
  const title = t('seo.productTitle', { name: short });
  document.title = title;
  setMeta('og:title', title, 'property');

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', canonicalHref(pathname));
}

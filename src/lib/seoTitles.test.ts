import { describe, it, expect } from 'vitest';
import { seoTitleKeyForPath } from './seoTitles';

describe('seoTitleKeyForPath', () => {
  it('снимает префикс языка и выбирает ключ', () => {
    expect(seoTitleKeyForPath('/ru/catalog')).toBe('seo.titleCatalog');
    expect(seoTitleKeyForPath('/en/product/x')).toBe('seo.titleProduct');
    expect(seoTitleKeyForPath('/kk/')).toBe('seo.titleHome');
  });
});

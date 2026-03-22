import { describe, expect, it } from 'vitest';
import { parseCatalogSearchParams } from './catalogUrlParams';

describe('parseCatalogSearchParams', () => {
  it('возвращает category для известного cat', () => {
    expect(parseCatalogSearchParams('?cat=food').category).toBe('food');
    expect(parseCatalogSearchParams('?cat=home_chemistry').category).toBe('home_chemistry');
  });

  it('отбрасывает неизвестный cat', () => {
    expect(parseCatalogSearchParams('?cat=unknown').category).toBeNull();
  });

  it('возвращает searchQuery', () => {
    expect(parseCatalogSearchParams('?q=сок').searchQuery).toBe('сок');
    expect(parseCatalogSearchParams('?cat=food&q=молоко').searchQuery).toBe('молоко');
  });

  it('пустой q даёт null', () => {
    expect(parseCatalogSearchParams('?q=').searchQuery).toBeNull();
    expect(parseCatalogSearchParams('').searchQuery).toBeNull();
  });

  it('принимает строку без ведущего ?', () => {
    expect(parseCatalogSearchParams('cat=food').category).toBe('food');
  });
});

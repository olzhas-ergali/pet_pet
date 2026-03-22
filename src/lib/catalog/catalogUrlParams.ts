import { CATEGORY_ID_TO_DB } from '@/lib/catalogCategories';

export type CatalogUrlState = {
  /** id из `CATEGORY_ID_TO_DB`, если валиден */
  category: string | null;
  /** Непустая строка поиска */
  searchQuery: string | null;
};

/** Разбор `location.search` каталога для фильтров (и unit-тестов). */
export function parseCatalogSearchParams(search: string): CatalogUrlState {
  const params = new URLSearchParams(
    search.startsWith('?') ? search : search ? `?${search}` : '',
  );
  const cat = params.get('cat');
  const q = params.get('q');
  const category = cat && cat in CATEGORY_ID_TO_DB ? cat : null;
  const searchQuery = q !== null && q !== '' ? q : null;
  return { category, searchQuery };
}

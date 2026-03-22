/** Стабильные id фильтра → значение category в БД (Supabase). Названия товаров/категорий в данных не переводятся. */
export const CATEGORY_ALL = '__ALL__' as const;

export const CATEGORY_ID_TO_DB = {
  home_chemistry: 'Бытовая химия',
  food: 'Продукты питания',
} as const;

export type CatalogCategoryId = keyof typeof CATEGORY_ID_TO_DB;

export function getDbCategoryForFilter(selectedId: string): string | null {
  if (selectedId === CATEGORY_ALL) return null;
  return CATEGORY_ID_TO_DB[selectedId as CatalogCategoryId] ?? null;
}

export function matchesCategoryFilter(productCategory: string, selectedId: string): boolean {
  if (selectedId === CATEGORY_ALL) return true;
  const db = getDbCategoryForFilter(selectedId);
  return db !== null && productCategory === db;
}

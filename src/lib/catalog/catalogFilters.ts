import type { TFunction } from 'i18next';
import type { Product } from '@/app/types';
import { CATEGORY_ALL, CATEGORY_ID_TO_DB, matchesCategoryFilter } from '@/lib/catalogCategories';

export type CategoryOption = { id: string; label: string };

/** Единый список категорий для витрины и каталога (i18n). */
export function buildCategoryOptions(t: TFunction): CategoryOption[] {
  return [
    { id: CATEGORY_ALL, label: t('catalog.category.all') },
    ...Object.keys(CATEGORY_ID_TO_DB).map((id) => ({
      id,
      label: t(`catalog.category.${id}`),
    })),
  ];
}

/** Фильтр только по категории (главная /market). */
export function filterProductsByCategory(products: Product[], selectedCategory: string): Product[] {
  return products.filter((p) => matchesCategoryFilter(p.category, selectedCategory));
}

/** Поиск + категория + диапазон цен (страница каталога). */
export function filterProductsByCatalogRules(
  products: Product[],
  opts: { searchQuery: string; selectedCategory: string; priceRange: [number, number] }
): Product[] {
  const q = opts.searchQuery.toLowerCase().trim();
  return products.filter((product) => {
    const matchesSearch = q === '' || product.name.toLowerCase().includes(q);
    const matchesCategory = matchesCategoryFilter(product.category, opts.selectedCategory);
    const matchesPrice =
      product.currentPrice >= opts.priceRange[0] && product.currentPrice <= opts.priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
  });
}

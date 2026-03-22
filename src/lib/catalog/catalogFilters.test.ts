import { describe, it, expect } from 'vitest';
import { CATEGORY_ALL } from '@/lib/catalogCategories';
import { filterProductsByCategory, filterProductsByCatalogRules } from '@/lib/catalog/catalogFilters';
import type { Product } from '@/app/types';

const baseProduct = (over: Partial<Product>): Product => ({
  id: '1',
  name: 'Test',
  description: '',
  category: 'Бытовая химия',
  image: '',
  basePrice: 100,
  discountPrice: null,
  currentPrice: 100,
  oldPrice: null,
  stock: 10,
  discount: 0,
  wholesalePrices: [],
  supplier: '',
  lastUpdate: new Date(),
  priceHistory: [],
  ...over,
});

describe('catalogFilters', () => {
  it('filterProductsByCategory по категории', () => {
    const list = [
      baseProduct({ id: 'a', category: 'Бытовая химия' }),
      baseProduct({ id: 'b', category: 'Продукты питания' }),
    ];
    const foodOnly = filterProductsByCategory(list, 'food');
    expect(foodOnly).toHaveLength(1);
    expect(foodOnly[0].id).toBe('b');
  });

  it('filterProductsByCatalogRules учитывает поиск и цену', () => {
    const list = [
      baseProduct({ id: 'a', name: 'Сабын', currentPrice: 500 }),
      baseProduct({ id: 'b', name: 'Гречка', currentPrice: 5000 }),
    ];
    const r = filterProductsByCatalogRules(list, {
      searchQuery: 'греч',
      selectedCategory: CATEGORY_ALL,
      priceRange: [0, 10000],
    });
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('b');
  });
});

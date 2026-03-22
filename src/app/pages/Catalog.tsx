import { useEffect, useMemo, useState } from 'react';
import { useCategoryOptions } from '@/hooks/useCategoryOptions';
import { filterProductsByCatalogRules } from '@/lib/catalog/catalogFilters';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { ProductCardNew } from '../components/ProductCardNew';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { BottomNav } from '../components/BottomNav';
import { motion, AnimatePresence } from 'motion/react';
import { useProductStore } from '@/store/productStore';
import { Product } from '../types';
import { CATEGORY_ALL } from '@/lib/catalogCategories';

export function Catalog() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORY_ALL);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [showFilters, setShowFilters] = useState(false);

  const products = useProductStore((s) => s.products);
  const loading = useProductStore((s) => s.loading);
  const error = useProductStore((s) => s.error);
  const load = useProductStore((s) => s.load);
  const pricePulseAt = useProductStore((s) => s.pricePulseAt);

  const categoryOptions = useCategoryOptions();

  useEffect(() => {
    void load();
  }, [load]);

  const filteredProducts = useMemo(
    () =>
      filterProductsByCatalogRules(products, {
        searchQuery,
        selectedCategory,
        priceRange,
      }),
    [products, searchQuery, selectedCategory, priceRange]
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(CATEGORY_ALL);
    setPriceRange([0, 200000]);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold mb-4">{t('catalog.title')}</h1>

          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('catalog.searchPlaceholder')}
              className="w-full pl-12 pr-12 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={t('catalog.clearSearch')}
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-medium">{t('catalog.filters')}</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-950 text-center py-3 px-4 text-sm">
          <p className="font-medium">{t('catalog.loadError')}</p>
          <p className="text-amber-800/90 mt-1">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-2 text-sm font-semibold text-emerald-700 underline"
          >
            {t('catalog.loadErrorRetry')}
          </button>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white rounded-2xl shadow-sm p-6 mb-6 overflow-hidden"
            >
              <h3 className="font-semibold mb-4">{t('catalog.categoryFilter')}</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl transition-all font-medium ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <h3 className="font-semibold mb-4">{t('catalog.price')}</h3>
              <div className="flex gap-4 items-center">
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([parseInt(e.target.value, 10) || 0, priceRange[1]])
                  }
                  placeholder={t('catalog.from')}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([
                      priceRange[0],
                      parseInt(e.target.value, 10) || 200000,
                    ])
                  }
                  placeholder={t('catalog.to')}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-4 text-gray-600">
          {t('catalog.found')}: <span className="font-semibold">{filteredProducts.length}</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('catalog.emptyDb')}</h3>
            <p className="text-gray-500 mb-4">{t('catalog.emptyDbHint')}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
            >
              {t('common.refresh')}
            </button>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product: Product) => (
              <ProductCardNew
                key={product.id}
                product={product}
                priceBumpAt={pricePulseAt[product.id]}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('catalog.emptyFilter')}</h3>
            <p className="text-gray-500 mb-4">{t('catalog.emptyFilterHint')}</p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
            >
              {t('catalog.resetFilters')}
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

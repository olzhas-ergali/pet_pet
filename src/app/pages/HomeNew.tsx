import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingDown, Flame, Package2, Bell, Zap } from 'lucide-react';
import { ProductCardNew } from '../components/ProductCardNew';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { RecentPurchases } from '../components/RecentPurchases';
import { BottomNav } from '../components/BottomNav';
import { Product } from '../types';
import { motion } from 'motion/react';
import { useProductStore } from '@/store/productStore';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { CATEGORY_ALL } from '@/lib/catalogCategories';
import { filterProductsByCategory } from '@/lib/catalog/catalogFilters';
import { useCategoryOptions } from '@/hooks/useCategoryOptions';

export function HomeNew() {
  const { t } = useTranslation();
  const products = useProductStore((s) => s.products);
  const loading = useProductStore((s) => s.loading);
  const error = useProductStore((s) => s.error);
  const load = useProductStore((s) => s.load);
  const pricePulseAt = useProductStore((s) => s.pricePulseAt);
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORY_ALL);
  const [refreshing, setRefreshing] = useState(false);

  const categoryOptions = useCategoryOptions();

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filteredProducts = filterProductsByCategory(products, selectedCategory);

  const hotDeals = products
    .filter((p) => p.discount && p.discount > 20)
    .sort((a, b) => (b.discount || 0) - (a.discount || 0))
    .slice(0, 4);

  const priceDropped = products
    .filter((p) => p.oldPrice && p.oldPrice > p.currentPrice)
    .sort(
      (a, b) =>
        (b.oldPrice! - b.currentPrice) / b.oldPrice! -
        (a.oldPrice! - a.currentPrice) / a.oldPrice!
    )
    .slice(0, 4);

  const lowStock = products
    .filter((p) => p.stock < 20)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <header className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-9 w-36 rounded-lg bg-gray-100" aria-label="Logo" />
              <p className="text-sm text-gray-500 mt-0.5">{t('home.tagline')}</p>
            </div>
            <button
              type="button"
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={t('home.bellAria')}
            >
              <Bell className="w-6 h-6 text-gray-700" aria-hidden />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {refreshing && (
        <div className="bg-emerald-50 text-emerald-700 text-center py-2 text-sm font-medium">
          {t('home.refreshing')}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-center py-2 text-sm px-4">{error}</div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="text-sm font-medium text-emerald-600 hover:underline"
          >
            {t('home.refreshCatalog')}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 rounded-3xl p-8 mb-8 text-white shadow-xl shadow-emerald-500/30 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-6 h-6 fill-yellow-300 text-yellow-300" />
              <span className="text-sm font-semibold text-emerald-100">{t('home.heroRealtime')}</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">{t('home.heroTitle')}</h2>
            <p className="text-emerald-100 text-lg">{t('home.heroSubtitle')}</p>
          </div>
        </motion.div>

        {!isSupabaseConfigured && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {t('home.noSupabase')}
          </div>
        )}

        <div className="space-y-8 mb-8">
          {!loading && hotDeals.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg shadow-red-500/30">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('home.sectionHot')}</h2>
                  <p className="text-sm text-gray-500">{t('home.sectionHotSub')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {hotDeals.map((product) => (
                  <ProductCardNew
                    key={product.id}
                    product={product}
                    priceBumpAt={pricePulseAt[product.id]}
                  />
                ))}
              </div>
            </section>
          )}

          {!loading && priceDropped.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/30">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('home.sectionDrop')}</h2>
                  <p className="text-sm text-gray-500">{t('home.sectionDropSub')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {priceDropped.map((product) => (
                  <ProductCardNew
                    key={product.id}
                    product={product}
                    priceBumpAt={pricePulseAt[product.id]}
                  />
                ))}
              </div>
            </section>
          )}

          {!loading && lowStock.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/30">
                  <Package2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('home.sectionLow')}</h2>
                  <p className="text-sm text-gray-500">{t('home.sectionLowSub')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {lowStock.map((product) => (
                  <ProductCardNew
                    key={product.id}
                    product={product}
                    priceBumpAt={pricePulseAt[product.id]}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {categoryOptions.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 rounded-2xl whitespace-nowrap transition-all font-medium ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product: Product) => (
              <ProductCardNew
                key={product.id}
                product={product}
                priceBumpAt={pricePulseAt[product.id]}
              />
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package2 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('home.notFound')}</h3>
            <p className="text-gray-500">{t('home.notFoundHint')}</p>
          </div>
        )}
      </div>

      <RecentPurchases />

      <BottomNav />
    </div>
  );
}

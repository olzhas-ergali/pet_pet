import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package, RefreshCw } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { Skeleton } from '../components/ui/skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cartStore';
import { useProductStore } from '@/store/productStore';
import { resolveUnitPrice } from '@/lib/pricing';
import { isBffEnabled } from '@/lib/api/bff';
import { fetchCartQuote, type CartQuote } from '@/lib/api/pricing';
import { formatNumberAmount } from '@/i18n/format';

export function Cart() {
  const { t, i18n } = useTranslation();
  const fmt = (n: number) => `${formatNumberAmount(n, i18n.language)} ${t('common.currency')}`;

  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const products = useProductStore((s) => s.products);
  const loadProducts = useProductStore((s) => s.load);
  const productsLoading = useProductStore((s) => s.loading);
  const productError = useProductStore((s) => s.error);
  const pricePulseAt = useProductStore((s) => s.pricePulseAt);

  const [bffQuote, setBffQuote] = useState<CartQuote | null>(null);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!isBffEnabled() || items.length === 0) {
      setBffQuote(null);
      return;
    }
    const missing = items.some((i) => !products.find((p) => p.id === i.productId));
    if (missing) return;
    let cancelled = false;
    const payload = items.map((i) => ({ product_id: i.productId, quantity: i.quantity }));
    void fetchCartQuote(payload).then((q) => {
      if (!cancelled && q) setBffQuote(q);
    });
    return () => {
      cancelled = true;
    };
  }, [items, products]);

  const quoteLineById = new Map((bffQuote?.lines ?? []).map((l) => [l.product_id, l]));

  const getUnit = (productId: string, quantity: number) => {
    const fromServer = quoteLineById.get(productId);
    if (fromServer && isBffEnabled()) return fromServer.unit_price;
    const p = products.find((x) => x.id === productId);
    if (!p) return 0;
    return resolveUnitPrice(p.basePrice, p.discountPrice, p.wholesalePrices, quantity);
  };

  const getRetailUnit = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return 0;
    return resolveUnitPrice(p.basePrice, p.discountPrice, p.wholesalePrices, 1);
  };

  const subtotalLocal = items.reduce(
    (sum, item) => sum + getUnit(item.productId, item.quantity) * item.quantity,
    0
  );
  const subtotal = bffQuote?.subtotal ?? subtotalLocal;

  const regularTotal = items.reduce(
    (sum, item) => sum + getRetailUnit(item.productId) * item.quantity,
    0
  );

  const savings = Math.max(0, regularTotal - subtotal);

  const deliveryFeeLocal = subtotal > 10000 ? 0 : 500;
  const deliveryFee = bffQuote?.delivery_fee ?? deliveryFeeLocal;
  const total = bffQuote?.total ?? subtotal + deliveryFee;

  const removeItem = (id: string) => {
    removeFromCart(id);
    toast.success(t('cart.itemRemoved'));
  };

  const missingPriceData = items.some((i) => !products.find((p) => p.id === i.productId));
  const hasMissingProduct =
    !productsLoading && items.some((i) => !products.find((p) => p.id === i.productId));
  const hasStockProblem =
    !productsLoading &&
    items.some((i) => {
      const p = products.find((x) => x.id === i.productId);
      if (!p) return false;
      return p.stock === 0 || i.quantity > p.stock;
    });
  const checkoutBlocked =
    missingPriceData || productsLoading || hasMissingProduct || hasStockProblem;

  const removeInvalidLines = () => {
    const invalidIds = items
      .filter((i) => !products.find((p) => p.id === i.productId))
      .map((i) => i.productId);
    invalidIds.forEach((id) => removeFromCart(id));
    if (invalidIds.length) toast.success(t('cart.invalidCleared', { count: invalidIds.length }));
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white sticky top-0 z-30 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">{t('cart.title')}</h1>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('cart.empty')}</h3>
          <p className="text-gray-500 mb-6">{t('cart.emptyHint')}</p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
          >
            {t('cart.toCatalog')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t('cart.title')}</h1>
            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-semibold">
              {t('cart.positionsCount', { count: items.length })}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {productError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex flex-wrap items-center gap-3">
            <span>{productError}</span>
            <button
              type="button"
              onClick={() => void loadProducts()}
              className="inline-flex items-center gap-1 font-semibold text-emerald-700"
            >
              <RefreshCw className="w-4 h-4" />
              {t('common.retry')}
            </button>
          </div>
        )}

        {hasMissingProduct && (
          <div className="mb-4 flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
            <span>{t('cart.productMissing')}</span>
            <button
              type="button"
              onClick={removeInvalidLines}
              className="font-semibold text-amber-900 underline decoration-amber-400 hover:text-amber-950"
            >
              {t('cart.removeInvalid')}
            </button>
          </div>
        )}

        {hasStockProblem && !hasMissingProduct && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {t('cart.checkoutBlocked')}
          </div>
        )}

        {productsLoading && missingPriceData ? (
          <div className="space-y-4 mb-6">
            {items.map((i) => (
              <Skeleton key={i.productId} className="h-32 w-full rounded-2xl" />
            ))}
            <p className="text-center text-sm text-gray-500">{t('cart.loadingPrices')}</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <AnimatePresence>
              {items.map((item) => {
                const p = products.find((x) => x.id === item.productId);
                const lineMissing = !productsLoading && !p;
                const currentPrice = p ? getUnit(item.productId, item.quantity) : 0;
                const retail = getRetailUnit(item.productId);
                const isWholesale = currentPrice < retail && item.quantity > 1;
                const bumped = Boolean(pricePulseAt[item.productId]);
                const lowStock = p != null && p.stock > 0 && p.stock < 20;
                const overQty = p != null && item.quantity > p.stock;

                return (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`bg-white rounded-2xl shadow-sm p-5 border ${
                      bumped ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-xl"
                      />

                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 line-clamp-2">{item.name}</h3>
                        {lineMissing && (
                          <p className="text-xs font-semibold text-amber-800 mb-1">
                            {t('cart.productMissing')}
                          </p>
                        )}
                        {bumped && (
                          <p className="text-xs font-semibold text-amber-700 mb-1">
                            {t('cart.priceUpdated')}
                          </p>
                        )}
                        {lowStock && !overQty && (
                          <p className="text-xs text-orange-600 mb-1">{t('cart.lowStock')}</p>
                        )}
                        {p != null && p.stock === 0 && (
                          <p className="text-xs text-red-600 mb-1 font-semibold">{t('cart.outOfStock')}</p>
                        )}
                        {overQty && (
                          <p className="text-xs text-red-600 mb-1">
                            {t('cart.overQty', { n: p?.stock ?? 0 })}
                          </p>
                        )}

                        <div className="mb-3">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-xl font-bold text-emerald-600">
                              {fmt(currentPrice)}
                            </span>
                            {isWholesale && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-semibold">
                                {t('cart.wholesaleBadge')}
                              </span>
                            )}
                          </div>
                          {isWholesale && (
                            <p className="text-xs text-gray-500 mt-1">
                              {t('cart.retailHint')}: {fmt(retail)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() =>
                                setQuantity(item.productId, Math.max(1, item.quantity - 1))
                              }
                              disabled={lineMissing}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors disabled:opacity-40"
                              aria-label={t('cart.ariaDecreaseQty')}
                            >
                              <Minus className="w-4 h-4" aria-hidden />
                            </button>
                            <span className="font-semibold min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (p && item.quantity >= p.stock) {
                                  toast.error(t('cart.noMoreStock'));
                                  return;
                                }
                                setQuantity(item.productId, item.quantity + 1);
                              }}
                              disabled={lineMissing || (p != null && item.quantity >= p.stock)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors disabled:opacity-40"
                              aria-label={t('cart.ariaIncreaseQty')}
                            >
                              <Plus className="w-4 h-4" aria-hidden />
                            </button>
                          </div>

                          <span className="text-gray-600">
                            = {fmt(currentPrice * item.quantity)}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="ml-auto text-red-500 hover:text-red-700 p-2"
                            aria-label={t('cart.ariaRemoveItem', { name: item.name })}
                          >
                            <Trash2 className="w-5 h-5" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 sticky bottom-24 md:bottom-6">
          <h3 className="font-semibold mb-4">{t('cart.summary')}</h3>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>{t('cart.items', { count: items.length })}</span>
              <span>{fmt(regularTotal)}</span>
            </div>

            {savings > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {t('cart.wholesaleSaving')}
                </span>
                <span>-{fmt(savings)}</span>
              </div>
            )}

            <div className="flex justify-between text-gray-600">
              <span>{t('cart.delivery')}</span>
              <span>
                {deliveryFee === 0 ? (
                  <span className="text-emerald-600 font-semibold">{t('cart.deliveryFree')}</span>
                ) : (
                  fmt(deliveryFee)
                )}
              </span>
            </div>

            {deliveryFee > 0 && subtotal < 10000 && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                {t('cart.deliveryUntilFree', {
                  amount: formatNumberAmount(10000 - subtotal, i18n.language),
                })}
              </p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="flex justify-between items-baseline">
              <span className="text-lg font-semibold">{t('cart.grandTotalLabel')}</span>
              <span className="text-3xl font-bold text-emerald-600">
                {fmt(total)}
              </span>
            </div>
          </div>

          {checkoutBlocked ? (
            <div
              className="w-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-4 text-center text-sm font-medium text-gray-500"
              title={t('cart.checkoutBlocked')}
            >
              {t('cart.checkoutBlocked')}
            </div>
          ) : (
            <Link
              to="/checkout"
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-4 rounded-2xl font-semibold text-lg hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              {t('cart.checkout')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

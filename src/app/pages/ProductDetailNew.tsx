import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router';
import {
  ArrowLeft,
  TrendingDown,
  Clock,
  Package,
  Truck,
  User,
  ShoppingCart,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Product } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { formatNumberAmount } from '@/i18n/format';
import { getDateFnsLocale } from '@/i18n/dateLocale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { PriceAnimation } from '../components/PriceAnimation';
import { fetchProductById } from '@/lib/api/products';
import { useProductPriceChannel } from '@/hooks/useProductPriceChannel';
import { useProductStore } from '@/store/productStore';
import { useCartStore } from '@/store/cartStore';
import { resolveUnitPrice } from '@/lib/pricing';
import { isBffEnabled } from '@/lib/api/bff';
import { fetchPricingQuote } from '@/lib/api/pricing';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { applyProductDetailSeo } from '@/lib/seoTitles';

export function ProductDetailNew() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const p = useLocalizedPath();
  const fmt = (n: number) => `${formatNumberAmount(n, i18n.language)} ${t('common.currency')}`;
  const dateLocale = getDateFnsLocale(i18n.language);
  const addToCart = useCartStore((s) => s.addToCart);
  const merged = useProductStore((s) => s.products.find((p) => p.id === id));
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedTier, setSelectedTier] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [previousPrice, setPreviousPrice] = useState<number | undefined>();
  const [quotedUnit, setQuotedUnit] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const lastPriceRef = useRef<number | undefined>(undefined);
  const prevRouteIdRef = useRef<string | undefined>(undefined);

  const commitProduct = useCallback((p: Product | null) => {
    if (p && lastPriceRef.current !== undefined && lastPriceRef.current !== p.currentPrice) {
      setPreviousPrice(lastPriceRef.current);
    }
    if (p) lastPriceRef.current = p.currentPrice;
    else lastPriceRef.current = undefined;
    setProduct(p);
  }, []);

  useProductPriceChannel(id, commitProduct);

  useEffect(() => {
    if (!id) return;
    if (prevRouteIdRef.current !== id) {
      prevRouteIdRef.current = id;
      lastPriceRef.current = undefined;
      setPreviousPrice(undefined);
      setProduct(null);
      setLoading(true);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (merged) {
      commitProduct(merged);
      setLoading(false);
      return;
    }
    let alive = true;
    void fetchProductById(id).then((p) => {
      if (!alive) return;
      commitProduct(p);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [id, merged, commitProduct]);

  useEffect(() => {
    if (loading || !product?.name) return;
    applyProductDetailSeo(product.name, location.pathname, t);
  }, [loading, product?.id, product?.name, location.pathname, t]);

  useEffect(() => {
    if (!product) return;
    const tier = product.wholesalePrices.findIndex(
      (t) => quantity >= t.min && quantity <= t.max
    );
    if (tier !== -1) setSelectedTier(tier);
  }, [quantity, product]);

  useEffect(() => {
    if (!product || !isBffEnabled()) {
      setQuotedUnit(null);
      return;
    }
    let alive = true;
    const t = setTimeout(() => {
      void fetchPricingQuote(product.id, quantity).then((r) => {
        if (alive && r) setQuotedUnit(r.unit_price);
      });
    }, 100);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [product?.id, quantity]);

  const chartData = useMemo(() => {
    if (!product?.priceHistory?.length) return [];
    const tf = new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' });
    return product.priceHistory.map((entry) => ({
      time: tf.format(entry.timestamp),
      price: entry.price,
    }));
  }, [product, i18n.language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <p className="text-gray-600">{t('productDetail.loading')}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-gray-600">{t('productDetail.notFound')}</p>
        <Link to={p('/catalog')} className="text-emerald-600 font-medium hover:underline">
          {t('productDetail.toCatalog')}
        </Link>
      </div>
    );
  }

  const images = [product.image, product.image, product.image].filter(Boolean);
  const currentPrice =
    quotedUnit ??
    resolveUnitPrice(
      product.basePrice,
      product.discountPrice,
      product.wholesalePrices,
      quantity
    );
  const totalPrice = currentPrice * quantity;
  const savings =
    product.oldPrice && product.oldPrice > currentPrice
      ? (product.oldPrice - currentPrice) * quantity
      : 0;

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.image,
      quantity,
    });
    toast.success(t('productDetail.toastAdded'), {
      description: t('productDetail.toastAddedDesc', {
        name: product.name,
        count: quantity,
        units: t('productCard.unitsShort'),
      }),
      action: {
        label: t('productDetail.toastGoCart'),
        onClick: () => navigate(p('/cart')),
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden />
            <span className="font-medium">{t('productDetail.backNav')}</span>
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-24 h-fit">
            <div className="relative mb-4">
              <img
                src={images[currentImageIndex] || product.image}
                alt={product.name}
                className="w-full h-96 object-cover rounded-xl"
              />

              {product.discount && product.discount > 0 && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg">
                  <TrendingDown className="w-5 h-5" />
                  <span>-{product.discount}%</span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentImageIndex(
                        (currentImageIndex - 1 + images.length) % images.length
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                    aria-label={t('productDetail.carouselPrev')}
                  >
                    <ChevronLeft className="w-6 h-6" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentImageIndex((currentImageIndex + 1) % images.length)
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                    aria-label={t('productDetail.carouselNext')}
                  >
                    <ChevronRight className="w-6 h-6" aria-hidden />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex ? 'border-emerald-600' : 'border-gray-200'
                    }`}
                    aria-label={t('productDetail.chooseImage', { n: index + 1 })}
                  >
                    <img
                      src={img}
                      alt={t('productDetail.thumbnailAlt', { n: index + 1 })}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <div className="inline-block px-3 py-1 bg-gray-100 rounded-lg text-sm font-semibold text-gray-600 mb-3">
                {product.category}
              </div>

              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                  <PriceAnimation
                    value={currentPrice}
                    previousValue={previousPrice}
                    className="text-5xl font-bold text-emerald-600"
                  />
                  {product.oldPrice && product.oldPrice > currentPrice && (
                    <span className="text-2xl text-gray-400 line-through">
                      {fmt(product.oldPrice)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-700 font-medium mb-2">
                  {t('productDetail.priceHint')}
                </p>

                {savings > 0 && (
                  <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-semibold">
                    {t('productDetail.youSave', {
                      amount: formatNumberAmount(savings, i18n.language),
                      currency: t('common.currency'),
                    })}
                  </div>
                )}
              </div>

              <div
                className={`flex items-center gap-2 mb-4 px-4 py-3 rounded-xl ${
                  product.stock < 20
                    ? 'bg-orange-50 text-orange-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                <Package className="w-5 h-5" />
                <span className="font-semibold">
                  {product.stock < 20 ? t('productCard.stockLeft') : t('productCard.inStock')} ·{' '}
                  {formatNumberAmount(product.stock, i18n.language)} {t('productCard.unitsShort')}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-6 text-sm bg-gray-50 p-4 rounded-xl">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">
                  {t('productDetail.priceUpdated')}{' '}
                  {formatDistanceToNow(product.lastUpdate, {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </span>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold">{t('productDetail.wholesaleTiers')}</h3>
                </div>
                <div className="space-y-3">
                  {product.wholesalePrices.map((tier, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        index === selectedTier
                          ? 'border-emerald-600 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg shadow-emerald-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setQuantity(tier.min);
                        setSelectedTier(index);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-700 mb-1">
                            {t('productDetail.tierRange', {
                              min: tier.min,
                              max: tier.max,
                              units: t('productCard.unitsShort'),
                            })}
                          </div>
                          {index === selectedTier && (
                            <div className="text-xs text-emerald-600 font-semibold">
                              {t('productDetail.currentRange')}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-600">
                            {fmt(tier.price)}
                          </div>
                          <div className="text-xs text-gray-500">{t('productDetail.perUnitInTier')}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {t('productDetail.quantity')}
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-xl border-2 border-gray-300 hover:border-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center font-bold text-xl"
                    aria-label={t('productDetail.ariaQtyMinus')}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="w-24 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-emerald-600 focus:outline-none"
                    min={1}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 rounded-xl border-2 border-gray-300 hover:border-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center font-bold text-xl"
                    aria-label={t('productDetail.ariaQtyPlus')}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl mb-6">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-gray-700 font-medium">{t('productDetail.total')}</span>
                  <span className="text-4xl font-bold text-emerald-600">
                    {fmt(totalPrice)}
                  </span>
                </div>
                {savings > 0 && (
                  <div className="text-sm text-emerald-600 text-right">
                    {t('productDetail.grandSavings', {
                      amount: formatNumberAmount(savings, i18n.language),
                      currency: t('common.currency'),
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="bg-white border-2 border-emerald-600 text-emerald-600 py-4 rounded-2xl font-semibold text-lg hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {t('productDetail.addToCart')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAddToCart();
                    navigate(p('/checkout'));
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-4 rounded-2xl font-semibold text-lg hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/30"
                  title={t('productDetail.buyOneClickHint')}
                >
                  {t('productDetail.buyOneClick')}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('productDetail.supplier')}</div>
                    <div className="font-semibold">{product.supplier}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('productDetail.delivery')}</div>
                    <div className="font-semibold">
                      {t('productDetail.deliveryEta', {
                        amount: formatNumberAmount(10000, i18n.language),
                        currency: t('common.currency'),
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-6">{t('productDetail.priceHistory')}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip
                  formatter={(value: number) => fmt(value as number)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

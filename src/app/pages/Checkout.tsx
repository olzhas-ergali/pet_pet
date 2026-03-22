import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { BottomNav } from '../components/BottomNav';
import { Skeleton } from '../components/ui/skeleton';
import { useCartStore } from '@/store/cartStore';
import { useProductStore } from '@/store/productStore';
import { useOrderStore } from '@/store/orderStore';
import { resolveUnitPrice } from '@/lib/pricing';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { validateCartStock } from '@/lib/api/orders';
import { formatStockIssues } from '@/lib/api/orderErrors';
import { isBffEnabled } from '@/lib/api/bff';
import { fetchCartQuoteWithMeta, type CartQuote } from '@/lib/api/pricing';
import { formatNumberAmount } from '@/i18n/format';
import { loadShippingDefaults, saveShippingDefaults } from '@/lib/shippingDefaults';

type Phase = 'idle' | 'validating' | 'submitting' | 'error';

export function Checkout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const fmt = (n: number) => `${formatNumberAmount(n, i18n.language)} ${t('common.currency')}`;

  const items = useCartStore((s) => s.items);
  const products = useProductStore((s) => s.products);
  const productsLoading = useProductStore((s) => s.loading);
  const catalogError = useProductStore((s) => s.error);
  const loadProducts = useProductStore((s) => s.load);
  const createOrder = useOrderStore((s) => s.createOrderFromCart);
  const orderError = useOrderStore((s) => s.error);
  const clearOrderError = useOrderStore((s) => s.clearOrderError);
  const submitting = useOrderStore((s) => s.submitting);

  const [note, setNote] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [stockMessage, setStockMessage] = useState<string | null>(null);
  const [bffQuote, setBffQuote] = useState<CartQuote | null>(null);
  const [bffQuoteUnavailable, setBffQuoteUnavailable] = useState(false);
  const shippingSeeded = useRef(false);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (shippingSeeded.current) return;
    shippingSeeded.current = true;
    const d = loadShippingDefaults();
    setRecipientPhone(d.recipient_phone ?? '');
    setAddressLine(d.address_line ?? '');
    setCity(d.city ?? '');
  }, []);

  useEffect(() => {
    if (!isBffEnabled() || items.length === 0) {
      setBffQuote(null);
      setBffQuoteUnavailable(false);
      return;
    }
    const missing = items.some((i) => !products.find((p) => p.id === i.productId));
    if (missing) {
      setBffQuote(null);
      setBffQuoteUnavailable(false);
      return;
    }
    let cancelled = false;
    const payload = items.map((i) => ({ product_id: i.productId, quantity: i.quantity }));
    void fetchCartQuoteWithMeta(payload).then(({ quote, bffUnavailable }) => {
      if (cancelled) return;
      setBffQuote(quote);
      setBffQuoteUnavailable(bffUnavailable);
    });
    return () => {
      cancelled = true;
    };
  }, [items, products]);

  const quoteLine = useMemo(
    () => new Map((bffQuote?.lines ?? []).map((l) => [l.product_id, l])),
    [bffQuote]
  );

  const nameByProductId = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of products) m.set(p.id, p.name);
    for (const i of items) m.set(i.productId, i.name);
    return m;
  }, [products, items]);

  const lines = items.map((i) => {
    const p = products.find((x) => x.id === i.productId);
    const q = quoteLine.get(i.productId);
    const unit = q?.unit_price ?? (p
      ? resolveUnitPrice(p.basePrice, p.discountPrice, p.wholesalePrices, i.quantity)
      : 0);
    return { ...i, unit, product: p };
  });

  const subtotalLocal = lines.reduce((s, l) => s + l.unit * l.quantity, 0);
  const subtotal = bffQuote?.subtotal ?? subtotalLocal;
  const deliveryFee = bffQuote?.delivery_fee ?? (subtotal > 10000 ? 0 : 500);
  const total = bffQuote?.total ?? subtotal + deliveryFee;

  const busy = phase === 'validating' || submitting;
  const missingProducts = items.some((i) => !products.find((p) => p.id === i.productId));
  const checkoutHardBlock = !productsLoading && missingProducts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearOrderError();
    setStockMessage(null);

    if (!isSupabaseConfigured) {
      toast.error(t('checkout.toastNoSupabase'));
      return;
    }
    if (items.length === 0) {
      toast.error(t('checkout.toastEmpty'));
      return;
    }
    if (missingProducts) {
      toast.error(t('checkout.toastLoadCatalog'), { description: t('checkout.toastLoadCatalogDesc') });
      return;
    }

    const payload = items.map((i) => ({ product_id: i.productId, quantity: i.quantity }));

    setPhase('validating');
    try {
      const v = await validateCartStock(payload);
      if (!v.ok) {
        if (v.code === 'auth_required') {
          setStockMessage(t('errors.submit.auth'));
          setPhase('error');
          return;
        }
        if (v.code === 'bff_unavailable') {
          const msg = t('errors.bff.unavailable');
          setStockMessage(msg);
          setPhase('error');
          toast.error(msg);
          return;
        }
        const msg = formatStockIssues(v.issues, nameByProductId);
        setStockMessage(msg);
        setPhase('error');
        toast.error(t('checkout.toastStock'), { description: msg });
        return;
      }

      setPhase('submitting');
      const meta =
        recipientPhone.trim() || addressLine.trim() || city.trim()
          ? {
              recipient_phone: recipientPhone.trim() || undefined,
              shipping_address: {
                ...(addressLine.trim() ? { line1: addressLine.trim() } : {}),
                ...(city.trim() ? { city: city.trim() } : {}),
              },
            }
          : undefined;
      const id = await createOrder(payload, meta);
      if (note) localStorage.setItem(`order_note_${id}`, note);
      saveShippingDefaults({
        recipient_phone: recipientPhone.trim(),
        address_line: addressLine.trim(),
        city: city.trim(),
      });
      toast.success(t('checkout.toastSuccess'));
      navigate(`/order-success?id=${encodeURIComponent(id)}`, { replace: true });
      setPhase('idle');
    } catch (err) {
      setPhase('error');
      toast.error(t('checkout.toastFail'), {
        description: (err as Error).message,
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white sticky top-0 z-30 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Link to="/cart" className="text-emerald-600 font-medium">
              {t('checkout.backToCart')}
            </Link>
            <h1 className="text-2xl font-bold mt-2">{t('checkout.title')}</h1>
          </div>
        </header>
        <div className="container mx-auto px-4 py-16 text-center max-w-md">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1.25} aria-hidden />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('checkout.empty')}</h2>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">{t('checkout.emptyHint')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/catalog"
              className="inline-flex justify-center items-center rounded-2xl bg-emerald-600 text-white font-semibold px-6 py-3 hover:bg-emerald-700 transition-colors"
            >
              {t('cart.toCatalog')}
            </Link>
            <Link
              to="/cart"
              className="inline-flex justify-center items-center rounded-2xl border-2 border-gray-200 font-semibold px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('checkout.backToCart')}
            </Link>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-emerald-600"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('checkout.back')}
          </button>
          <h1 className="text-2xl font-bold mt-2">{t('checkout.titleFull')}</h1>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="container mx-auto px-4 py-6 max-w-lg space-y-6"
      >
        {catalogError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-medium">{t('catalog.loadError')}</p>
            <p className="text-amber-900/90 mt-1">{catalogError}</p>
            <button
              type="button"
              onClick={() => void loadProducts()}
              className="mt-2 text-sm font-semibold text-emerald-700 underline"
            >
              {t('catalog.loadErrorRetry')}
            </button>
          </div>
        )}

        {isBffEnabled() && bffQuoteUnavailable && items.length > 0 && !checkoutHardBlock && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            {t('checkout.bffQuoteBanner')}
          </div>
        )}

        {checkoutHardBlock && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-medium">{t('cart.productMissing')}</p>
            <Link to="/cart" className="mt-2 inline-block font-semibold text-emerald-700 underline">
              {t('checkout.backToCart')}
            </Link>
          </div>
        )}

        {(stockMessage || orderError) && (
          <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{t('checkout.errorTitle')}</p>
              <p>{stockMessage ?? orderError}</p>
              <button
                type="button"
                className="mt-2 text-emerald-700 font-medium underline"
                onClick={() => {
                  setStockMessage(null);
                  clearOrderError();
                  void loadProducts();
                }}
              >
                {t('checkout.retryHint')}
              </button>
            </div>
          </div>
        )}

        {productsLoading && missingProducts ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <p className="text-sm text-gray-500 text-center">{t('checkout.loadData')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <h2 className="font-semibold">{t('checkout.composition')}</h2>
            {lines.map((l) => {
              const stock = l.product?.stock;
              const over = stock != null && l.quantity > stock;
              return (
                <div key={l.productId} className="flex justify-between text-sm gap-2">
                  <span className="text-gray-700 line-clamp-2">
                    {l.name}
                    {over && (
                      <span className="block text-amber-600 text-xs mt-1">
                        {t('checkout.lowStockHint', { n: stock ?? 0 })}
                      </span>
                    )}
                  </span>
                  <span className="font-medium whitespace-nowrap">
                    ×{l.quantity} · {fmt(l.unit * l.quantity)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('checkout.shippingTitle')}</h2>
          <p className="text-xs text-gray-500">{t('checkout.shippingHint')}</p>
          <input
            type="tel"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            disabled={busy}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
            placeholder={t('checkout.shippingPhone')}
            autoComplete="tel"
          />
          <input
            type="text"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            disabled={busy}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
            placeholder={t('checkout.shippingAddress')}
            autoComplete="street-address"
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={busy}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
            placeholder={t('checkout.shippingCity')}
            autoComplete="address-level2"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-2">
          <label className="text-sm font-semibold text-gray-700">{t('checkout.comment')}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            disabled={busy}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
            placeholder={t('checkout.commentPlaceholder')}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{t('checkout.subtotal')}</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('checkout.delivery')}</span>
            <span>
              {deliveryFee === 0 ? (
                <span className="text-emerald-600 font-semibold">{t('cart.deliveryFree')}</span>
              ) : (
                fmt(deliveryFee)
              )}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>{t('checkout.grandTotal')}</span>
            <span className="text-emerald-600">{fmt(total)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={
            busy ||
            !isSupabaseConfigured ||
            (productsLoading && missingProducts) ||
            checkoutHardBlock
          }
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {phase === 'validating' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('checkout.validating')}
            </>
          ) : submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('checkout.submitting')}
            </>
          ) : (
            <>
              {t('checkout.submit')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <BottomNav />
    </div>
  );
}

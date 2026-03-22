import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Plus, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { BottomNav } from '../components/BottomNav';
import { useAuthStore } from '@/store/authStore';
import {
  createSupplierProduct,
  fetchMySupplierProducts,
  fetchSupplierOrdersDashboard,
  updateProductPrice,
  updateProductStock,
  type SupplierOrderRow,
} from '@/lib/api/supplier';
import { mapRpcUserMessage } from '@/lib/api/orderErrors';
import type { Product } from '../types';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { CATEGORY_ID_TO_DB } from '@/lib/catalogCategories';
import { useOrderFeedStore } from '@/store/orderFeedStore';
import { formatNumberAmount } from '@/i18n/format';

export function Supplier() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const orderTick = useOrderFeedStore((s) => s.tick);
  const [list, setList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [incomingOrders, setIncomingOrders] = useState<SupplierOrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(CATEGORY_ID_TO_DB.food);
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'
  );
  const [basePrice, setBasePrice] = useState('1000');
  const [discountPrice, setDiscountPrice] = useState('');
  const [quantity, setQuantity] = useState('50');

  const canAccess = user?.role === 'supplier' || user?.role === 'admin';

  const reload = async () => {
    if (!isSupabaseConfigured || !canAccess) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchMySupplierProducts();
      setList(data);
    } catch (e) {
      toast.error(mapRpcUserMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [canAccess]);

  useEffect(() => {
    if (!canAccess || !isSupabaseConfigured) {
      setIncomingOrders([]);
      return;
    }
    let alive = true;
    setOrdersLoading(true);
    void fetchSupplierOrdersDashboard()
      .then((rows) => {
        if (alive) setIncomingOrders(rows);
      })
      .catch(() => {
        if (alive) setIncomingOrders([]);
      })
      .finally(() => {
        if (alive) setOrdersLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [canAccess, orderTick]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAccess) return;
    try {
      await createSupplierProduct({
        name,
        description,
        category,
        image_url: imageUrl,
        base_price: Number(basePrice),
        discount_price: discountPrice === '' ? null : Number(discountPrice),
        quantity: Number(quantity),
        wholesale_tiers: [
          { min: 1, max: 9, price: Number(discountPrice || basePrice) },
          { min: 10, max: 49, price: Math.round(Number(discountPrice || basePrice) * 0.95) },
          { min: 50, max: 9999, price: Math.round(Number(discountPrice || basePrice) * 0.9) },
        ],
      });
      toast.success(t('supplier.created'));
      setName('');
      setDescription('');
      await reload();
    } catch (err) {
      toast.error(mapRpcUserMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">{t('supplier.title')}</h1>
          <p className="text-sm text-gray-500">{t('supplier.subtitle')}</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-8 max-w-lg">
        {!canAccess && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-sm space-y-2">
            <p>{t('supplier.roleHint')}</p>
            <code className="block bg-white/80 px-2 py-1 rounded text-xs break-all">
              {t('supplier.roleHintSql')}
            </code>
          </div>
        )}

        {canAccess && (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-600" />
              {t('supplier.incomingOrders')}
            </h2>
            {ordersLoading ? (
              <p className="text-sm text-gray-500">{t('common.loading')}</p>
            ) : incomingOrders.length === 0 ? (
              <p className="text-sm text-gray-500">{t('supplier.noOrdersYet')}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {incomingOrders.slice(0, 12).map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-wrap justify-between gap-2 border border-gray-100 rounded-xl px-3 py-2"
                  >
                    <span className="font-mono text-xs text-gray-500">{o.id.slice(0, 8)}…</span>
                    <span className="font-medium">
                      {formatNumberAmount(Number(o.total_amount), i18n.language)} {t('common.currency')}
                    </span>
                    <span className="text-emerald-600">{t(`orders.status.${o.status}`)}</span>
                    {o.tracking_number ? (
                      <span className="text-xs text-gray-500 w-full">
                        {t('profile.tracking')}: {o.tracking_number}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-gray-400">{t('supplier.ordersRealtimeHint')}</p>
          </div>
        )}

        {canAccess && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <Plus className="w-5 h-5 text-emerald-600" />
              {t('supplier.newProduct')}
            </div>
            <input
              className="w-full border-2 rounded-xl px-3 py-2"
              placeholder={t('supplier.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <textarea
              className="w-full border-2 rounded-xl px-3 py-2"
              placeholder={t('supplier.description')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <label className="block text-sm font-medium text-gray-700">{t('supplier.category')}</label>
            <select
              className="w-full border-2 rounded-xl px-3 py-2 bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {Object.entries(CATEGORY_ID_TO_DB).map(([id, db]) => (
                <option key={id} value={db}>
                  {t(`catalog.category.${id}`)}
                </option>
              ))}
            </select>
            <input
              className="w-full border-2 rounded-xl px-3 py-2"
              placeholder={t('supplier.imageUrl')}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="border-2 rounded-xl px-3 py-2"
                type="number"
                placeholder={t('supplier.basePrice')}
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
              />
              <input
                className="border-2 rounded-xl px-3 py-2"
                type="number"
                placeholder={t('supplier.discountPrice')}
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
              />
            </div>
            <input
              className="w-full border-2 rounded-xl px-3 py-2"
              type="number"
              placeholder={t('supplier.stock')}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
            >
              {t('supplier.create')}
            </button>
          </form>
        )}

        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Package className="w-5 h-5" />
            {t('supplier.myItems')}
          </h2>
          {loading ? (
            <p className="text-gray-500 text-sm">{t('common.loading')}</p>
          ) : list.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('supplier.empty')}</p>
          ) : (
            <div className="space-y-4">
              {list.map((p) => (
                <SupplierRow key={p.id} product={p} onSaved={reload} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function SupplierRow({ product, onSaved }: { product: Product; onSaved: () => void }) {
  const { t } = useTranslation();
  const [bp, setBp] = useState(String(product.basePrice));
  const [dp, setDp] = useState(
    product.discountPrice != null ? String(product.discountPrice) : ''
  );
  const [stock, setStock] = useState(String(product.stock));

  const save = async () => {
    try {
      await updateProductPrice(product.id, {
        base_price: Number(bp),
        discount_price: dp === '' ? null : Number(dp),
      });
      await updateProductStock(product.id, Number(stock));
      toast.success(t('supplier.saved'));
      onSaved();
    } catch (e) {
      toast.error(mapRpcUserMessage(e));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
      <div className="font-medium line-clamp-2">{product.name}</div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <input
          className="border rounded-lg px-2 py-1"
          title={t('supplier.basePrice')}
          value={bp}
          onChange={(e) => setBp(e.target.value)}
        />
        <input
          className="border rounded-lg px-2 py-1"
          value={dp}
          onChange={(e) => setDp(e.target.value)}
          placeholder={t('supplier.discountPh')}
        />
        <input
          className="border rounded-lg px-2 py-1"
          title={t('supplier.stock')}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={() => void save()}
        className="text-sm font-semibold text-emerald-600 hover:underline"
      >
        {t('supplier.save')}
      </button>
    </div>
  );
}

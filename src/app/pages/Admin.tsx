import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  LayoutDashboard,
  Package,
  Users,
  Megaphone,
  Percent,
  Bell,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { BottomNav } from '../components/BottomNav';
import { Skeleton } from '../components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';
import { useAuthStore } from '@/store/authStore';
import { fetchProducts } from '@/lib/api/products';
import {
  fetchAdminSalesOverview,
  fetchAdminOrders,
  adminSetOrderStatus,
  adminEnqueueNotification,
  adminBulkApplyDiscountPercent,
  type AdminSalesOverview,
} from '@/lib/api/admin';
import { updateProductPrice, updateProductStock } from '@/lib/api/supplier';
import { mapRpcUserMessage } from '@/lib/api/orderErrors';
import type { Product } from '../types';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { CATEGORY_ID_TO_DB } from '@/lib/catalogCategories';
import { formatNumberAmount } from '@/i18n/format';
import type { OrderRow } from '@/types/database';

type AdminTab = 'overview' | 'orders' | 'catalog' | 'suppliers' | 'broadcast' | 'promotions' | 'alerts';

export function Admin() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [list, setList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminSalesOverview | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const [adminOrders, setAdminOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const isAdmin = user?.role === 'admin';

  const reloadProducts = useCallback(async () => {
    if (!isSupabaseConfigured || !isAdmin) return;
    setLoading(true);
    try {
      const data = await fetchProducts();
      setList(data);
    } catch (e) {
      toast.error(mapRpcUserMessage(e));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const reloadOrders = useCallback(async () => {
    if (!isSupabaseConfigured || !isAdmin) return;
    setOrdersLoading(true);
    try {
      const o = await fetchAdminOrders();
      setAdminOrders(o);
    } catch (e) {
      toast.error(mapRpcUserMessage(e));
      setAdminOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    void reloadProducts();
  }, [isAdmin, reloadProducts]);

  useEffect(() => {
    if (!isAdmin || tab !== 'orders' || !isSupabaseConfigured) return;
    void reloadOrders();
  }, [isAdmin, tab, reloadOrders]);

  useEffect(() => {
    if (!isAdmin || tab !== 'overview' || !isSupabaseConfigured) return;
    setStatsLoading(true);
    setStatsError(false);
    void fetchAdminSalesOverview()
      .then((s) => {
        setStats(s);
        if (!s) setStatsError(true);
      })
      .catch(() => {
        setStats(null);
        setStatsError(true);
      })
      .finally(() => setStatsLoading(false));
  }, [isAdmin, tab]);

  const fmtMoney = (n: number) => `${formatNumberAmount(n, i18n.language)} ${t('common.currency')}`;

  const tabs: { id: AdminTab; icon: typeof LayoutDashboard; labelKey: string }[] = [
    { id: 'overview', icon: LayoutDashboard, labelKey: 'admin.tabOverview' },
    { id: 'orders', icon: ClipboardList, labelKey: 'admin.tabOrders' },
    { id: 'catalog', icon: Package, labelKey: 'admin.tabCatalog' },
    { id: 'suppliers', icon: Users, labelKey: 'admin.tabSuppliers' },
    { id: 'broadcast', icon: Megaphone, labelKey: 'admin.tabBroadcast' },
    { id: 'promotions', icon: Percent, labelKey: 'admin.tabPromotions' },
    { id: 'alerts', icon: Bell, labelKey: 'admin.tabAlerts' },
  ];

  const supplierGroups = useMemo(() => {
    const m = new Map<string, Product[]>();
    for (const p of list) {
      const k = p.supplierId ?? '__platform__';
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(p);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [list]);

  const lowStock = useMemo(() => list.filter((p) => p.stock > 0 && p.stock < 20), [list]);
  const hotDeals = useMemo(
    () => list.filter((p) => (p.discount ?? 0) > 20).sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0)),
    [list]
  );

  if (!isAdmin) {
    return <Navigate to="/catalog" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-7 h-7 text-emerald-600" />
            {t('admin.title')}
          </h1>
          <p className="text-sm text-gray-500">{t('admin.subtitle')}</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-4xl space-y-4">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide md:flex-wrap">
              {tabs.map(({ id, icon: Icon, labelKey }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    tab === id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(labelKey)}
                </button>
              ))}
            </div>

            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {tab === 'overview' && (
                <div className="space-y-4">
                  {statsLoading && (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-2xl" />
                      ))}
                    </div>
                  )}
                  {!statsLoading && statsError && (
                    <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      {t('admin.statsUnavailable')}
                    </p>
                  )}
                  {!statsLoading && stats && !statsError && (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      <StatCard label={t('admin.ordersTotal')} value={String(stats.total_orders)} />
                      <StatCard label={t('admin.revenueTotal')} value={fmtMoney(stats.total_revenue)} />
                      <StatCard label={t('admin.orders7d')} value={String(stats.orders_last_7d)} />
                      <StatCard
                        label={t('admin.eventsPending')}
                        value={String(stats.pending_integration_events)}
                      />
                      <StatCard
                        label={t('admin.notificationsPending')}
                        value={String(stats.pending_notifications)}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => void reloadProducts()}
                    className="text-sm font-semibold text-emerald-600 hover:underline"
                  >
                    {t('admin.refresh')}
                  </button>
                </div>
              )}

              {tab === 'orders' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">{t('admin.ordersPanelHint')}</p>
                    <button
                      type="button"
                      onClick={() => void reloadOrders()}
                      className="text-sm font-semibold text-emerald-600 hover:underline"
                    >
                      {t('admin.refresh')}
                    </button>
                  </div>
                  {ordersLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                      ))}
                    </div>
                  ) : adminOrders.length === 0 ? (
                    <p className="text-sm text-gray-500">{t('admin.ordersEmpty')}</p>
                  ) : (
                    <ul className="space-y-3">
                      {adminOrders.map((o) => (
                        <li
                          key={o.id}
                          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                        >
                          <div className="text-sm space-y-1">
                            <p className="font-mono text-xs text-gray-500">{o.id.slice(0, 8)}…</p>
                            <p className="font-semibold">
                              {fmtMoney(Number(o.total_amount))}
                              {o.tracking_number ? (
                                <span className="ml-2 text-xs font-normal text-gray-500">
                                  · {t('profile.tracking')}: {o.tracking_number}
                                </span>
                              ) : null}
                            </p>
                          </div>
                          <select
                            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm bg-white min-w-[140px]"
                            value={o.status}
                            onChange={(e) => {
                              const next = e.target.value;
                              void (async () => {
                                try {
                                  await adminSetOrderStatus(o.id, next);
                                  toast.success(t('admin.orderStatusUpdated'));
                                  await reloadOrders();
                                } catch (err) {
                                  toast.error(mapRpcUserMessage(err));
                                }
                              })();
                            }}
                          >
                            {['pending', 'paid', 'shipped', 'cancelled', 'completed'].map((s) => (
                              <option key={s} value={s}>
                                {t(`orders.status.${s}`)}
                              </option>
                            ))}
                          </select>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {tab === 'catalog' &&
                (loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-36 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  list.map((p) => (
                    <AdminRow key={p.id} product={p} onSaved={reloadProducts} />
                  ))
                ))}

              {tab === 'suppliers' && (
                <div className="space-y-4">
                  {supplierGroups.map(([key, products]) => (
                    <div
                      key={key}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {key === '__platform__'
                          ? t('admin.supplierPlatform')
                          : `${t('admin.supplierAssigned')} · ${key.slice(0, 8)}…`}
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">
                        {t('admin.productsCount', { count: products.length })}
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1 max-h-40 overflow-y-auto">
                        {products.map((p) => (
                          <li key={p.id} className="line-clamp-1">
                            {p.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'broadcast' && (
                <AdminBroadcastPanel
                  onQueued={() => toast.success(t('admin.broadcastQueued'))}
                />
              )}

              {tab === 'promotions' && (
                <AdminPromotionsPanel
                  onDone={(n) => toast.success(t('admin.promoDone', { count: n }))}
                  onReload={() => void reloadProducts()}
                />
              )}

              {tab === 'alerts' && (
                <div className="space-y-6">
                  <section>
                    <h3 className="font-semibold mb-2">{t('admin.alertsLowStock')}</h3>
                    {lowStock.length === 0 ? (
                      <p className="text-sm text-gray-500">{t('admin.noAlerts')}</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {lowStock.map((p) => (
                          <li
                            key={p.id}
                            className="flex justify-between gap-2 rounded-xl bg-white border border-gray-100 px-3 py-2"
                          >
                            <span className="line-clamp-2">{p.name}</span>
                            <span className="text-orange-600 font-medium whitespace-nowrap">
                              {p.stock}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                  <section>
                    <h3 className="font-semibold mb-2">{t('admin.alertsHot')}</h3>
                    {hotDeals.length === 0 ? (
                      <p className="text-sm text-gray-500">{t('admin.noAlerts')}</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {hotDeals.slice(0, 12).map((p) => (
                          <li
                            key={p.id}
                            className="flex justify-between gap-2 rounded-xl bg-white border border-gray-100 px-3 py-2"
                          >
                            <span className="line-clamp-2">{p.name}</span>
                            <span className="text-emerald-600 font-medium">-{p.discount}%</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              )}
            </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function AdminBroadcastPanel({ onQueued }: { onQueued: () => void }) {
  const { t } = useTranslation();
  const [channel, setChannel] = useState<'push' | 'email' | 'telegram'>('email');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminEnqueueNotification({ channel, title, body, audience: { all_customers: true } });
      onQueued();
      setTitle('');
      setBody('');
    } catch (err) {
      toast.error(mapRpcUserMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs text-gray-500">{t('admin.broadcastHint')}</p>
      <label className="block text-sm font-medium text-gray-700">{t('admin.broadcastChannel')}</label>
      <select
        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 bg-white"
        value={channel}
        onChange={(e) => setChannel(e.target.value as 'push' | 'email' | 'telegram')}
      >
        <option value="email">Email</option>
        <option value="push">Push</option>
        <option value="telegram">Telegram</option>
      </select>
      <input
        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2"
        placeholder={t('admin.broadcastTitle')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 min-h-[100px]"
        placeholder={t('admin.broadcastBody')}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {t('admin.broadcastQueue')}
          </button>
        </TooltipTrigger>
        <TooltipContent>{t('admin.broadcastHint')}</TooltipContent>
      </Tooltip>
    </form>
  );
}

function AdminPromotionsPanel({
  onDone,
  onReload,
}: {
  onDone: (n: number) => void;
  onReload: () => void;
}) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<string>('');
  const [percent, setPercent] = useState('10');
  const [busy, setBusy] = useState(false);

  const dbCategories = useMemo(
    () => ['', ...Array.from(new Set(Object.values(CATEGORY_ID_TO_DB)))],
    []
  );

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(percent);
    if (Number.isNaN(p) || p < 0 || p >= 100) return;
    if (!window.confirm(t('admin.promoConfirm'))) return;
    setBusy(true);
    try {
      const n = await adminBulkApplyDiscountPercent(category || null, p);
      onDone(n);
      onReload();
    } catch (err) {
      toast.error(mapRpcUserMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void apply(e)} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <label className="block text-sm font-medium text-gray-700">{t('admin.promoCategory')}</label>
      <select
        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 bg-white"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {dbCategories.map((c) => (
          <option key={c || 'all'} value={c}>
            {c === '' ? '—' : c}
          </option>
        ))}
      </select>
      <label className="block text-sm font-medium text-gray-700">{t('admin.promoPercent')}</label>
      <input
        type="number"
        min={0}
        max={99}
        step={1}
        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2"
        value={percent}
        onChange={(e) => setPercent(e.target.value)}
        required
      />
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-amber-600 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {t('admin.promoApply')}
      </button>
    </form>
  );
}

function AdminRow({ product, onSaved }: { product: Product; onSaved: () => Promise<void> }) {
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
      toast.success(t('admin.updated'));
      await onSaved();
    } catch (e) {
      toast.error(mapRpcUserMessage(e));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="text-xs text-gray-500">{product.category}</div>
      <div className="font-medium">{product.name}</div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <input
          className="border rounded-lg px-2 py-1"
          value={bp}
          onChange={(e) => setBp(e.target.value)}
          title={t('admin.base')}
        />
        <input
          className="border rounded-lg px-2 py-1"
          value={dp}
          onChange={(e) => setDp(e.target.value)}
          placeholder={t('admin.discountPh')}
        />
        <input
          className="border rounded-lg px-2 py-1"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          title={t('admin.stock')}
        />
      </div>
      <button
        type="button"
        onClick={() => void save()}
        className="text-sm font-semibold text-emerald-600 hover:underline"
      >
        {t('admin.apply')}
      </button>
    </div>
  );
}

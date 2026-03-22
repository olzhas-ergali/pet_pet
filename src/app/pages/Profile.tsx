import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  User,
  Bell,
  CreditCard,
  MapPin,
  LogOut,
  ChevronRight,
  Package,
  Store,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { BottomNav } from '../components/BottomNav';
import { Skeleton } from '../components/ui/skeleton';
import { getDateFnsLocale } from '@/i18n/dateLocale';
import { formatNumberAmount } from '@/i18n/format';
import { useAuthStore } from '@/store/authStore';
import { fetchMyOrders } from '@/lib/api/orders';
import type { OrderRow } from '@/types/database';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useOrderFeedStore } from '@/store/orderFeedStore';

export function Profile() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(false);
  const orderTick = useOrderFeedStore((s) => s.tick);

  const dateLocale = getDateFnsLocale(i18n.language);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      setOrders([]);
      setOrdersLoading(false);
      setOrdersError(false);
      return;
    }
    setOrdersLoading(true);
    setOrdersError(false);
    void fetchMyOrders()
      .then((list) => setOrders(list))
      .catch(() => {
        setOrders([]);
        setOrdersError(true);
      })
      .finally(() => setOrdersLoading(false));
  }, [user, orderTick]);

  const menuItems = useMemo(
    () => [
      { icon: User, label: t('profile.personal'), to: '/profile/personal' },
      { icon: MapPin, label: t('profile.addresses'), to: '/profile/addresses' },
      { icon: CreditCard, label: t('profile.payment'), to: '/profile/payment' },
      { icon: Bell, label: t('profile.notifications'), to: '/profile/notifications' },
    ],
    [t]
  );

  const roleLabel = useMemo(() => {
    if (user?.role === 'supplier') return t('profile.roles.supplier');
    if (user?.role === 'admin') return t('profile.roles.admin');
    return t('profile.roles.customer');
  }, [t, user?.role]);

  const totalSum = orders.reduce((s, o) => s + Number(o.total_amount), 0);

  const phoneLabel =
    user?.phone ??
    user?.email ??
    (isSupabaseConfigured ? t('profile.guest') : t('profile.noConnection'));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{phoneLabel}</h1>
                <p className="text-emerald-100 capitalize">{roleLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <Link
            to="/supplier"
            className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center gap-2 hover:bg-gray-50"
          >
            <Store className="w-8 h-8 text-emerald-600" />
            <span className="text-sm font-medium text-center">{t('profile.supplier')}</span>
          </Link>
          <Link
            to="/admin"
            className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center gap-2 hover:bg-gray-50"
          >
            <Shield className="w-8 h-8 text-emerald-600" />
            <span className="text-sm font-medium text-center">{t('profile.admin')}</span>
          </Link>
          <Link
            to="/catalog"
            className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center gap-2 hover:bg-gray-50 sm:col-span-1 col-span-2"
          >
            <Package className="w-8 h-8 text-emerald-600" />
            <span className="text-sm font-medium">{t('profile.catalog')}</span>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-emerald-600 mb-1">{orders.length}</div>
            <div className="text-sm text-gray-500">{t('profile.ordersCount')}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-emerald-600 mb-1">
              {orders.length ? `${Math.min(40, orders.length * 3)}%` : '—'}
            </div>
            <div className="text-sm text-gray-500">{t('profile.savings')}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-emerald-600 mb-1">
              {totalSum > 0 ? `${Math.round(totalSum / 1000)}k` : '—'}
            </div>
            <div className="text-sm text-gray-500">{t('profile.sum')}</div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4">{t('profile.demoHint')}</p>

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <h2 className="font-semibold mb-3">{t('profile.recentOrders')}</h2>
          {ordersLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : ordersError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <p>{t('profile.ordersError')}</p>
              <button
                type="button"
                onClick={() => {
                  if (!user) return;
                  setOrdersLoading(true);
                  setOrdersError(false);
                  void fetchMyOrders()
                    .then(setOrders)
                    .catch(() => {
                      setOrders([]);
                      setOrdersError(true);
                    })
                    .finally(() => setOrdersLoading(false));
                }}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
              >
                <RefreshCw className="w-4 h-4" />
                {t('profile.ordersRetry')}
              </button>
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">{t('profile.noOrdersYet')}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id} className="border-b border-gray-100 pb-3 space-y-1 last:border-0">
                  <div className="flex justify-between gap-2 flex-wrap">
                    <span className="text-gray-600">
                      {format(new Date(o.created_at), 'd MMM', { locale: dateLocale })}
                    </span>
                    <span className="font-medium">
                      {formatNumberAmount(Number(o.total_amount), i18n.language)} {t('common.currency')}
                    </span>
                    <span className="text-emerald-600 font-medium">
                      {t(`orders.status.${o.status}`, { defaultValue: o.status })}
                    </span>
                  </div>
                  {o.tracking_number ? (
                    <p className="text-xs text-gray-500">
                      {t('profile.tracking')}: <span className="font-mono">{o.tracking_number}</span>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left ${
                  index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="p-2 bg-gray-100 rounded-xl">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
                <span className="flex-1 font-medium text-gray-900">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" aria-hidden />
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className="w-full bg-white text-red-600 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors shadow-sm"
        >
          <LogOut className="w-5 h-5" />
          {t('profile.logout')}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

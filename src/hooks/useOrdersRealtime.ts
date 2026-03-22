import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useOrderFeedStore } from '@/store/orderFeedStore';
import i18n from '@/i18n';

/**
 * Подписка на изменения заказов (RLS: свой заказ, заказы с товарами поставщика, админ — все).
 * @param enabled — как у usePricesRealtime: не подписываться, пока нет сессии / не готов layout.
 * При смене `user`, выходе (null) или `enabled === false` срабатывает cleanup → removeChannel (нет «висящих» каналов).
 */
export function useOrdersRealtime(enabled = true) {
  const user = useAuthStore((s) => s.user);
  const toastDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured || !user) return;
    const supabase = getSupabase()!;
    const userId = user.id;
    const ch = supabase
      .channel(`orders_feed_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          useOrderFeedStore.getState().bump();
          const role = useAuthStore.getState().user?.role;
          if (role === 'admin') return;
          if (toastDebounce.current) clearTimeout(toastDebounce.current);
          toastDebounce.current = setTimeout(() => {
            toast.info(i18n.t('realtime.ordersSynced'));
            toastDebounce.current = null;
          }, 900);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[realtime] orders:', status);
        }
      });

    return () => {
      if (toastDebounce.current) clearTimeout(toastDebounce.current);
      void supabase.removeChannel(ch);
    };
    // `user` целиком: смена id/роли/объекта профиля → новый канал; null → только cleanup
  }, [enabled, user]);
}

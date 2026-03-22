import { useEffect } from 'react';
import { toast } from 'sonner';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useProductStore } from '@/store/productStore';
import { useRealtimeStore } from '@/store/realtimeStore';
import i18n from '@/i18n';

let priceToastBatch = 0;
let priceToastTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePriceToast() {
  priceToastBatch += 1;
  if (priceToastTimer) return;
  priceToastTimer = setTimeout(() => {
    toast.success(i18n.t('realtime.pricesBatch', { count: priceToastBatch }));
    priceToastBatch = 0;
    priceToastTimer = null;
  }, 1400);
}

// Подписка на все изменения prices → стор (INSERT/UPDATE; DELETE редок — полный reload при необходимости)
export function usePricesRealtime(enabled = true) {
  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) return;
    const supabase = getSupabase()!;
    const ch = supabase
      .channel('prices_stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prices' },
        (payload) => {
          const row = payload.new as Record<string, unknown> | null;
          if (!row || typeof row.product_id !== 'string') {
            if (payload.eventType === 'DELETE') {
              void useProductStore.getState().load();
            }
            return;
          }
          useProductStore.getState().onPriceRow({
            product_id: row.product_id,
            base_price: Number(row.base_price),
            discount_price:
              row.discount_price == null || row.discount_price === ''
                ? null
                : Number(row.discount_price),
            updated_at: String(row.updated_at),
          });
          schedulePriceToast();
        }
      )
      .subscribe((status) => {
        const setPricesChannel = useRealtimeStore.getState().setPricesChannel;
        if (status === 'SUBSCRIBED') {
          setPricesChannel('subscribed');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[realtime] prices:', status);
          setPricesChannel('error');
        }
      });
    return () => {
      useRealtimeStore.getState().setPricesChannel('idle');
      void supabase.removeChannel(ch);
    };
  }, [enabled]);
}

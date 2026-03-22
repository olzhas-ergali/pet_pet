import { useEffect, useRef } from 'react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchProductById } from '@/lib/api/products';
import type { Product } from '@/app/types';

// Обновление карточки при смене цены, даже если товара нет в общем списке
export function useProductPriceChannel(
  productId: string | undefined,
  setProduct: (p: Product | null) => void
) {
  const ref = useRef(setProduct);
  ref.current = setProduct;

  useEffect(() => {
    if (!productId || !isSupabaseConfigured) return;
    const supabase = getSupabase()!;
    const ch = supabase
      .channel(`price_${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prices',
          filter: `product_id=eq.${productId}`,
        },
        async () => {
          const p = await fetchProductById(productId);
          if (p) ref.current(p);
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [productId]);
}

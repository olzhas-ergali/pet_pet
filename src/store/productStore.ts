import { create } from 'zustand';
import type { Product } from '@/app/types';
import { fetchProducts, mergePriceUpdate, fetchProductById } from '@/lib/api/products';
import { isBffEnabled } from '@/lib/api/bff';

export type PriceRowPayload = {
  product_id: string;
  base_price: number;
  discount_price: number | null;
  updated_at: string;
};

const PRICE_DEBOUNCE_MS = 120;
let priceDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const pendingPrices = new Map<string, PriceRowPayload>();

type ProductState = {
  products: Product[];
  loading: boolean;
  error: string | null;
  pricePulseAt: Record<string, number>;
  load: () => Promise<void>;
  onPriceRow: (row: PriceRowPayload) => void;
};

function flushPriceUpdates(set: (fn: (s: ProductState) => Partial<ProductState>) => void) {
  const rows = [...pendingPrices.values()];
  pendingPrices.clear();
  priceDebounceTimer = null;
  if (rows.length === 0) return;

  if (isBffEnabled()) {
    void (async () => {
      const updates = await Promise.all(rows.map((r) => fetchProductById(r.product_id)));
      set((s) => {
        let next = [...s.products];
        const pulse = { ...s.pricePulseAt };
        const now = Date.now();
        for (let i = 0; i < rows.length; i++) {
          const fresh = updates[i];
          if (!fresh) continue;
          const idx = next.findIndex((x) => x.id === fresh.id);
          if (idx >= 0) next[idx] = fresh;
          else next.push(fresh);
          pulse[rows[i].product_id] = now;
        }
        return { products: next, pricePulseAt: pulse };
      });
    })();
    return;
  }

  set((s) => {
    let nextProducts = s.products;
    const pulse = { ...s.pricePulseAt };
    const now = Date.now();
    for (const row of rows) {
      const before = nextProducts;
      nextProducts = mergePriceUpdate(nextProducts, row);
      const p = nextProducts.find((x) => x.id === row.product_id);
      const prevP = before.find((x) => x.id === row.product_id);
      if (p && prevP && (p.basePrice !== prevP.basePrice || p.discountPrice !== prevP.discountPrice)) {
        pulse[row.product_id] = now;
      }
    }
    return { products: nextProducts, pricePulseAt: pulse };
  });
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  loading: false,
  error: null,
  pricePulseAt: {},

  load: async () => {
    set({ loading: true, error: null });
    try {
      const products = await fetchProducts();
      set({ products, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  onPriceRow: (row) => {
    pendingPrices.set(row.product_id, row);
    if (priceDebounceTimer) clearTimeout(priceDebounceTimer);
    priceDebounceTimer = setTimeout(() => flushPriceUpdates(set), PRICE_DEBOUNCE_MS);
  },
}));

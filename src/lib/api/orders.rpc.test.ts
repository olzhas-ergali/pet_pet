import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCartStock } from './orders';

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: true,
  getSupabase: () => ({
    rpc: vi.fn((name: string, args: { p_items: unknown }) => {
      if (name === 'validate_cart_stock') {
        const items = args.p_items as { product_id: string; quantity: number }[];
        if (items.some((i) => i.quantity > 10)) {
          return Promise.resolve({
            data: {
              ok: false,
              code: 'insufficient_stock',
              issues: [
                {
                  product_id: 'x',
                  available: 2,
                  requested: 99,
                },
              ],
            },
            error: null,
          });
        }
        return Promise.resolve({ data: { ok: true }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }),
  }),
}));

describe('validateCartStock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('возвращает ok при достаточном остатке', async () => {
    const r = await validateCartStock([{ product_id: 'a', quantity: 1 }]);
    expect(r.ok).toBe(true);
  });

  it('возвращает issues при нехватке', async () => {
    const r = await validateCartStock([{ product_id: 'a', quantity: 99 }]);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.issues?.length).toBeGreaterThan(0);
    }
  });
});

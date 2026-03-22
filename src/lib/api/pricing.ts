import { isBffEnabled, bffFetchJson } from '@/lib/api/bff';

export type CartQuoteLine = {
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type CartQuote = {
  lines: CartQuoteLine[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  currency: string;
};

export async function fetchCartQuote(
  lines: { product_id: string; quantity: number }[]
): Promise<CartQuote | null> {
  if (!isBffEnabled() || lines.length === 0) return null;
  try {
    return await bffFetchJson<CartQuote>('/pricing/cart-quote', {
      method: 'POST',
      body: JSON.stringify({ lines }),
    });
  } catch {
    return null;
  }
}

export async function fetchPricingQuote(
  productId: string,
  quantity: number
): Promise<{ unit_price: number } | null> {
  if (!isBffEnabled()) return null;
  try {
    return await bffFetchJson<{ unit_price: number }>('/pricing/quote', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  } catch {
    return null;
  }
}

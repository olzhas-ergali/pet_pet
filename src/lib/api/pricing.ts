import { isBffEnabled, bffFetchJson } from '@/lib/api/bff';
import { isBffClientError } from '@/lib/api/bffClientError';

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

export type FetchCartQuoteOutcome = { quote: CartQuote | null; bffUnavailable: boolean };

export async function fetchCartQuoteWithMeta(
  lines: { product_id: string; quantity: number }[]
): Promise<FetchCartQuoteOutcome> {
  if (!isBffEnabled() || lines.length === 0) return { quote: null, bffUnavailable: false };
  try {
    const quote = await bffFetchJson<CartQuote>('/pricing/cart-quote', {
      method: 'POST',
      body: JSON.stringify({ lines }),
    });
    return { quote, bffUnavailable: false };
  } catch (e) {
    const bffUnavailable =
      isBffClientError(e) &&
      (e.kind === 'network' || e.kind === 'unavailable' || e.kind === 'unauthorized');
    return { quote: null, bffUnavailable: !!bffUnavailable };
  }
}

export async function fetchCartQuote(
  lines: { product_id: string; quantity: number }[]
): Promise<CartQuote | null> {
  const { quote } = await fetchCartQuoteWithMeta(lines);
  return quote;
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

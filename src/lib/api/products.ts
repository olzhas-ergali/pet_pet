import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { ProductRow } from '@/types/database';
import { mapProductRow } from '@/lib/mappers/product';
import type { Product } from '@/app/types';
import { discountPercent, firstTierUnitPrice } from '@/lib/pricing';
import { isBffEnabled, bffFetchJson } from '@/lib/api/bff';
import { parseProductFromApiJson } from '@/lib/productJson';

const productSelect = `
  *,
  prices (*),
  inventory (*)
`;

export async function fetchProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];

  if (isBffEnabled()) {
    const { data } = await bffFetchJson<{ data: unknown[] }>('/products');
    return (data ?? []).map((row) => parseProductFromApiJson(row));
  }

  const supabase = getSupabase()!;
  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as ProductRow[]).map((row) => mapProductRow(row));
}

export async function fetchProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured) return null;

  if (isBffEnabled()) {
    try {
      const { data } = await bffFetchJson<{ data: unknown }>(`/products/${id}`);
      if (!data) return null;
      return parseProductFromApiJson(data);
    } catch {
      return null;
    }
  }

  const supabase = getSupabase()!;
  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapProductRow(data as ProductRow);
}

export function mergePriceUpdate(
  products: Product[],
  payload: { product_id: string; base_price: number; discount_price: number | null; updated_at: string }
): Product[] {
  return products.map((p) => {
    if (p.id !== payload.product_id) return p;
    const base = Number(payload.base_price);
    const discount =
      payload.discount_price != null ? Number(payload.discount_price) : null;
    if (p.basePrice === base && p.discountPrice === discount) {
      return p;
    }
    const tiers = p.wholesalePrices;
    const current = firstTierUnitPrice(base, discount, tiers);
    const pct = discountPercent(base, current);
    return {
      ...p,
      basePrice: base,
      currentPrice: current,
      discountPrice: payload.discount_price != null ? Number(payload.discount_price) : null,
      oldPrice: pct > 0 ? base : undefined,
      discount: pct > 0 ? pct : undefined,
      lastUpdate: new Date(payload.updated_at),
      priceHistory: [
        ...p.priceHistory,
        { timestamp: new Date(payload.updated_at), price: current },
      ].slice(-12),
    };
  });
}

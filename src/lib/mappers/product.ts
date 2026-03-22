import type { Product } from '@/app/types';
import type { ProductRow, WholesaleTier } from '@/types/database';
import { discountPercent, firstTierUnitPrice } from '@/lib/pricing';

function one<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

function supplierLabel(row: ProductRow): string {
  if (row.supplier_id) return 'Поставщик';
  return 'Платформа';
}

export function mapProductRow(row: ProductRow, priceUpdatedAt?: string): Product {
  const price = one(row.prices);
  const inv = one(row.inventory);
  const base = Number(price?.base_price ?? 0);
  const discount = price?.discount_price != null ? Number(price.discount_price) : null;
  const tiers = (row.wholesale_tiers as WholesaleTier[] | null) ?? [];
  const current = firstTierUnitPrice(base, discount, tiers);
  const pct = discountPercent(base, current);
  const stock = inv?.quantity ?? 0;
  const updated = priceUpdatedAt ?? price?.updated_at ?? row.created_at;

  const wholesalePrices =
    tiers.length > 0
      ? tiers
      : [
          { min: 1, max: 9999, price: current },
          { min: 10, max: 9999, price: Math.round(current * 0.95) },
          { min: 50, max: 9999, price: Math.round(current * 0.9) },
        ];

  return {
    id: row.id,
    supplierId: row.supplier_id ?? null,
    name: row.name,
    category: row.category,
    image: row.image_url ?? '',
    basePrice: base,
    currentPrice: current,
    discountPrice: discount,
    oldPrice: pct > 0 ? base : undefined,
    discount: pct > 0 ? pct : undefined,
    stock,
    supplier: supplierLabel(row),
    lastUpdate: new Date(updated),
    wholesalePrices,
    priceHistory: [{ timestamp: new Date(updated), price: current }],
  };
}

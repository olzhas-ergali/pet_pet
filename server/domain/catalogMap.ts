import type { Product } from '../../shared/product.js';
import type { WholesaleTier } from '../../shared/pricing.js';
import { discountPercent, firstTierUnitPrice, resolveUnitPrice } from '../../shared/pricing.js';

type PriceRow = {
  base_price?: number;
  discount_price?: number | null;
  updated_at?: string;
};

type InvRow = { quantity?: number };

type DbProduct = {
  id: string;
  supplier_id?: string | null;
  name: string;
  category: string;
  image_url?: string | null;
  wholesale_tiers?: { min: number; max: number; price: number }[] | null;
  created_at: string;
  prices?: PriceRow | PriceRow[] | null;
  inventory?: InvRow | InvRow[] | null;
};

function one<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

function supplierLabel(row: DbProduct): string {
  if (row.supplier_id) return 'Поставщик';
  return 'Платформа';
}

/** Реальные ступени из БД или синтетические — одна логика для каталога и cart-quote */
export function resolvedWholesaleTiers(row: DbProduct): WholesaleTier[] {
  const price = one(row.prices);
  const base = Number(price?.base_price ?? 0);
  const discount = price?.discount_price != null ? Number(price.discount_price) : null;
  const raw = row.wholesale_tiers ?? [];
  if (raw.length > 0) return raw;
  const current = firstTierUnitPrice(base, discount, []);
  return [
    { min: 1, max: 9999, price: current },
    { min: 10, max: 9999, price: Math.round(current * 0.95) },
    { min: 50, max: 9999, price: Math.round(current * 0.9) },
  ];
}

export function unitPriceForQuantity(row: DbProduct, quantity: number): number {
  const price = one(row.prices);
  const base = Number(price?.base_price ?? 0);
  const discount = price?.discount_price != null ? Number(price.discount_price) : null;
  const tiers = resolvedWholesaleTiers(row);
  return resolveUnitPrice(base, discount, tiers, quantity);
}

/** Каноническое отображение каталога для API (источник правды — backend) */
export function mapDbRowToProduct(row: DbProduct, priceUpdatedAt?: string): Product {
  const price = one(row.prices);
  const inv = one(row.inventory);
  const base = Number(price?.base_price ?? 0);
  const discount = price?.discount_price != null ? Number(price.discount_price) : null;
  const tiers = resolvedWholesaleTiers(row);
  const current = resolveUnitPrice(base, discount, tiers, 1);
  const pct = discountPercent(base, current);
  const stock = inv?.quantity ?? 0;
  const updated = priceUpdatedAt ?? price?.updated_at ?? row.created_at;

  const wholesalePrices = tiers;

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

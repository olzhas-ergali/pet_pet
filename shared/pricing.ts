/**
 * Единая логика расчёта цены (BFF + fallback без BFF в тестах).
 */

export type WholesaleTier = { min: number; max: number; price: number };

export function resolveUnitPrice(
  basePrice: number,
  discountPrice: number | null | undefined,
  tiers: WholesaleTier[] | null | undefined,
  quantity: number
): number {
  const fallback = discountPrice ?? basePrice;
  if (!tiers?.length) return fallback;
  for (const t of tiers) {
    if (quantity >= t.min && quantity <= t.max) return t.price;
  }
  return fallback;
}

export function firstTierUnitPrice(
  basePrice: number,
  discountPrice: number | null | undefined,
  tiers: WholesaleTier[] | null | undefined
): number {
  return resolveUnitPrice(basePrice, discountPrice, tiers, 1);
}

export function discountPercent(base: number, current: number): number {
  if (base <= 0) return 0;
  return Math.max(0, Math.round(((base - current) / base) * 100));
}

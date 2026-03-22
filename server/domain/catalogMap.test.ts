import { describe, it, expect } from 'vitest';
import { mapDbRowToProduct, resolvedWholesaleTiers, unitPriceForQuantity } from './catalogMap';

describe('catalogMap', () => {
  it('синтетические ступени согласованы с unitPriceForQuantity', () => {
    const row = {
      id: '1',
      supplier_id: null,
      name: 'Test',
      category: 'c',
      image_url: null,
      wholesale_tiers: null,
      created_at: new Date().toISOString(),
      prices: { base_price: 1000, discount_price: null, updated_at: new Date().toISOString() },
      inventory: { quantity: 100 },
    };
    const tiers = resolvedWholesaleTiers(row);
    expect(tiers.length).toBeGreaterThan(0);
    const u1 = unitPriceForQuantity(row, 1);
    const u15 = unitPriceForQuantity(row, 15);
    expect(u15).toBeLessThanOrEqual(u1);
    const p = mapDbRowToProduct(row);
    expect(p.supplierId).toBeNull();
    expect(p.wholesalePrices.length).toBe(tiers.length);
  });
});

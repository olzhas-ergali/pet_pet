import { describe, it, expect } from 'vitest';
import { resolveUnitPrice, discountPercent } from './pricing';

describe('resolveUnitPrice', () => {
  it('берёт подходящий оптовый диапазон', () => {
    const tiers = [
      { min: 1, max: 9, price: 100 },
      { min: 10, max: 49, price: 80 },
    ];
    expect(resolveUnitPrice(120, 100, tiers, 5)).toBe(100);
    expect(resolveUnitPrice(120, 100, tiers, 15)).toBe(80);
  });

  it('fallback на скидку или базу', () => {
    expect(resolveUnitPrice(100, 90, [], 3)).toBe(90);
    expect(resolveUnitPrice(100, null, [], 3)).toBe(100);
  });
});

describe('discountPercent', () => {
  it('считает процент снижения', () => {
    expect(discountPercent(100, 75)).toBe(25);
  });
});

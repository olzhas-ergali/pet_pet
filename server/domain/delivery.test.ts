import { describe, it, expect } from 'vitest';
import { deliveryFeeKzt } from './delivery';

describe('deliveryFeeKzt', () => {
  it('бесплатно строго выше порога', () => {
    expect(deliveryFeeKzt(10001)).toBe(0);
    expect(deliveryFeeKzt(10000)).toBe(500);
  });

  it('фикс ниже порога', () => {
    expect(deliveryFeeKzt(5000)).toBe(500);
  });
});

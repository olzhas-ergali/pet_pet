import { describe, it, expect } from 'vitest';
import { getPostLoginDestination } from './navigation';

describe('getPostLoginDestination', () => {
  it('возвращает from если валиден', () => {
    expect(getPostLoginDestination('/checkout')).toBe('/checkout');
  });

  it('не возвращает /auth', () => {
    expect(getPostLoginDestination('/auth')).toBe('/');
  });

  it('fallback на главную', () => {
    expect(getPostLoginDestination(undefined)).toBe('/');
  });
});

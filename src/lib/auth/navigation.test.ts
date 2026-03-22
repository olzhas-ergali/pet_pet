import { describe, it, expect } from 'vitest';
import { getPostLoginDestination } from './navigation';

describe('getPostLoginDestination', () => {
  it('возвращает from если валиден', () => {
    expect(getPostLoginDestination('/checkout')).toBe('/checkout');
  });

  it('не возвращает /auth — ведёт на витрину', () => {
    expect(getPostLoginDestination('/auth')).toBe('/market');
  });

  it('fallback на витрину', () => {
    expect(getPostLoginDestination(undefined)).toBe('/market');
  });

  it('с лендинга / ведёт на витрину, не на публичную главную', () => {
    expect(getPostLoginDestination('/')).toBe('/market');
  });
});

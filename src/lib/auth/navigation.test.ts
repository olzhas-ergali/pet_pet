import { describe, it, expect } from 'vitest';
import { getPostLoginDestination } from './navigation';

describe('getPostLoginDestination', () => {
  it('возвращает from если валиден (с префиксом языка)', () => {
    expect(getPostLoginDestination('/ru/checkout', 'ru')).toBe('/ru/checkout');
    expect(getPostLoginDestination('/en/catalog', 'ru')).toBe('/en/catalog');
  });

  it('дописывает префикс языка к старому пути без /{lang}', () => {
    expect(getPostLoginDestination('/checkout', 'kk')).toBe('/kk/checkout');
  });

  it('не возвращает /auth — ведёт на витрину', () => {
    expect(getPostLoginDestination('/ru/auth', 'ru')).toBe('/ru/market');
    expect(getPostLoginDestination('/auth', 'en')).toBe('/en/market');
  });

  it('fallback на витрину с префиксом языка', () => {
    expect(getPostLoginDestination(undefined, 'ru')).toBe('/ru/market');
    expect(getPostLoginDestination(undefined, 'en')).toBe('/en/market');
  });

  it('с лендинга / ведёт на витрину', () => {
    expect(getPostLoginDestination('/ru/', 'ru')).toBe('/ru/market');
    expect(getPostLoginDestination('/', 'kk')).toBe('/kk/market');
  });
});

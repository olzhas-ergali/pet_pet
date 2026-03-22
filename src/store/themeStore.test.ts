import { describe, expect, it, beforeEach } from 'vitest';
import { applyThemeToDocument } from './themeStore';

describe('applyThemeToDocument', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('добавляет класс dark', () => {
    applyThemeToDocument('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('убирает класс dark для light', () => {
    document.documentElement.classList.add('dark');
    applyThemeToDocument('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  extractRuNationalDigits,
  formatRuNationalDisplay,
  ruE164FromNational,
} from './ruMobile';

describe('ruMobile', () => {
  it('extracts national digits from masked or full paste', () => {
    expect(extractRuNationalDigits('')).toBe('');
    expect(extractRuNationalDigits('9')).toBe('9');
    expect(extractRuNationalDigits('912')).toBe('912');
    expect(extractRuNationalDigits('(912) 345-67-89')).toBe('9123456789');
    expect(extractRuNationalDigits('+7 (912) 345-67-89')).toBe('9123456789');
    expect(extractRuNationalDigits('79123456789')).toBe('9123456789');
    expect(extractRuNationalDigits('89123456789')).toBe('9123456789');
    expect(extractRuNationalDigits('912345678900')).toBe('9123456789');
  });

  it('formats national digits progressively', () => {
    expect(formatRuNationalDisplay('')).toBe('');
    expect(formatRuNationalDisplay('9')).toBe('(9');
    expect(formatRuNationalDisplay('912')).toBe('(912) ');
    expect(formatRuNationalDisplay('912345')).toBe('(912) 345');
    expect(formatRuNationalDisplay('9123456789')).toBe('(912) 345-67-89');
  });

  it('builds E.164', () => {
    expect(ruE164FromNational('9123456789')).toBe('+79123456789');
    expect(ruE164FromNational('912')).toBe('');
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import i18n from '@/i18n';
import { mapSubmitOrderError, formatStockIssues, extractMessage, mapRpcUserMessage } from './orderErrors';

beforeAll(async () => {
  await i18n.changeLanguage('ru');
});

describe('mapSubmitOrderError', () => {
  it('мапит недостаток остатка', () => {
    const t = mapSubmitOrderError(new Error('insufficient stock for product x'));
    expect(t).toContain('Недостаточно');
  });

  it('мапит auth', () => {
    expect(mapSubmitOrderError({ message: 'auth required' })).toContain('Сессия');
  });

  it('extractMessage из строки', () => {
    expect(extractMessage('x')).toBe('x');
  });
});

describe('mapRpcUserMessage', () => {
  it('мапит permission denied', () => {
    expect(mapRpcUserMessage(new Error('permission denied for table'))).toContain('прав');
  });
});

describe('formatStockIssues', () => {
  it('форматирует список', () => {
    const names = new Map<string, string>([['a', 'Мыло']]);
    const s = formatStockIssues(
      [{ product_id: 'a', available: 1, requested: 5 }],
      names
    );
    expect(s).toContain('Мыло');
    expect(s).toContain('5');
  });
});

import { describe, it, expect } from 'vitest';
import { parseOrderLines } from './orderLines.js';

describe('parseOrderLines', () => {
  it('принимает валидные строки', () => {
    expect(parseOrderLines([{ product_id: '  uuid  ', quantity: 2 }])).toEqual([
      { product_id: 'uuid', quantity: 2 },
    ]);
  });

  it('пустой массив только с allowEmpty', () => {
    expect(parseOrderLines([])).toBeNull();
    expect(parseOrderLines([], { allowEmpty: true })).toEqual([]);
  });

  it('отклоняет неверное количество', () => {
    expect(parseOrderLines([{ product_id: 'a', quantity: 0 }])).toBeNull();
    expect(parseOrderLines([{ product_id: 'a', quantity: 1.5 }])).toBeNull();
  });
});

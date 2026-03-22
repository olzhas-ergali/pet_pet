export type OrderLineInput = { product_id: string; quantity: number };

type ParseOpts = { allowEmpty?: boolean };

/** Нормализация и валидация позиций заказа до RPC. */
export function parseOrderLines(raw: unknown, opts?: ParseOpts): OrderLineInput[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length === 0) return opts?.allowEmpty ? [] : null;
  const out: OrderLineInput[] = [];
  for (const x of raw) {
    if (x === null || typeof x !== 'object') return null;
    const id = (x as { product_id?: unknown }).product_id;
    const q = (x as { quantity?: unknown }).quantity;
    if (typeof id !== 'string' || id.trim() === '') return null;
    const n = Number(q);
    if (!Number.isInteger(n) || n < 1) return null;
    out.push({ product_id: id.trim(), quantity: n });
  }
  return out;
}

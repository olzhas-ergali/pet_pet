import type { Product } from '@/app/types';

/** Ответ BFF сериализует Date в ISO-строки — приводим к Product */
export function parseProductFromApiJson(raw: unknown): Product {
  const d = raw as Record<string, unknown>;
  const ph = Array.isArray(d.priceHistory) ? d.priceHistory : [];
  return {
    id: String(d.id ?? ''),
    supplierId:
      (d.supplierId ?? d.supplier_id) != null && String(d.supplierId ?? d.supplier_id) !== ''
        ? String(d.supplierId ?? d.supplier_id)
        : null,
    name: String(d.name ?? ''),
    category: String(d.category ?? ''),
    image: String(d.image ?? ''),
    basePrice: Number(d.basePrice ?? 0),
    currentPrice: Number(d.currentPrice ?? 0),
    discountPrice: d.discountPrice == null ? null : Number(d.discountPrice),
    oldPrice: d.oldPrice != null ? Number(d.oldPrice) : undefined,
    discount: d.discount != null ? Number(d.discount) : undefined,
    stock: Number(d.stock ?? 0),
    supplier: String(d.supplier ?? ''),
    lastUpdate: new Date(String(d.lastUpdate ?? 0)),
    wholesalePrices: Array.isArray(d.wholesalePrices)
      ? (d.wholesalePrices as Product['wholesalePrices'])
      : [],
    priceHistory: ph.map((h) => {
      const x = h as Record<string, unknown>;
      return {
        timestamp: new Date(String(x.timestamp ?? 0)),
        price: Number(x.price ?? 0),
      };
    }),
  };
}

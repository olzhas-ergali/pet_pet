export interface Product {
  id: string;
  /** id поставщика в БД; null — товар платформы */
  supplierId?: string | null;
  name: string;
  category: string;
  image: string;
  basePrice: number;
  /** розничная/первая ступень для UI */
  currentPrice: number;
  discountPrice: number | null;
  oldPrice?: number;
  discount?: number;
  stock: number;
  supplier: string;
  lastUpdate: Date;
  wholesalePrices: {
    min: number;
    max: number;
    price: number;
  }[];
  priceHistory: {
    timestamp: Date;
    price: number;
  }[];
}

export type { Product } from '../../shared/product';

export interface RecentPurchase {
  id: string;
  productName: string;
  quantity: number;
  timestamp: Date;
}

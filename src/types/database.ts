export type UserRole = 'customer' | 'supplier' | 'admin';

export type WholesaleTier = { min: number; max: number; price: number };

export type ProfileRow = {
  id: string;
  phone: string | null;
  display_name: string | null;
  role: UserRole;
  created_at: string;
};

export type ProductRow = {
  id: string;
  supplier_id: string | null;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  wholesale_tiers: WholesaleTier[] | null;
  created_at: string;
  prices?: PriceRow | PriceRow[] | null;
  inventory?: InventoryRow | InventoryRow[] | null;
};

export type PriceRow = {
  id: string;
  product_id: string;
  base_price: number;
  discount_price: number | null;
  updated_at: string;
};

export type InventoryRow = {
  id: string;
  product_id: string;
  quantity: number;
};

export type OrderRow = {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at?: string;
  tracking_number?: string | null;
  shipping_address?: Record<string, unknown> | null;
  recipient_phone?: string | null;
};

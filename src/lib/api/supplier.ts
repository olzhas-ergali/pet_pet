import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { ProductRow, WholesaleTier } from '@/types/database';
import { mapProductRow } from '@/lib/mappers/product';
import type { Product } from '@/app/types';

const productSelect = `
  *,
  prices (*),
  inventory (*)
`;

export type NewProductInput = {
  name: string;
  description: string;
  category: string;
  image_url: string;
  base_price: number;
  discount_price: number | null;
  quantity: number;
  wholesale_tiers: WholesaleTier[];
};

export async function createSupplierProduct(input: NewProductInput): Promise<string> {
  if (!isSupabaseConfigured) throw new Error('Supabase не настроен');
  const supabase = getSupabase()!;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Нужна авторизация');

  const { data: prod, error: pe } = await supabase
    .from('products')
    .insert({
      supplier_id: user.id,
      name: input.name,
      description: input.description,
      category: input.category,
      image_url: input.image_url,
      wholesale_tiers: input.wholesale_tiers,
    })
    .select('id')
    .single();
  if (pe) throw pe;
  const id = prod!.id as string;

  const { error: e1 } = await supabase.from('prices').insert({
    product_id: id,
    base_price: input.base_price,
    discount_price: input.discount_price,
  });
  if (e1) throw e1;

  const { error: e2 } = await supabase.from('inventory').insert({
    product_id: id,
    quantity: input.quantity,
  });
  if (e2) throw e2;

  return id;
}

export async function updateProductPrice(
  productId: string,
  patch: { base_price?: number; discount_price?: number | null }
): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase не настроен');
  const supabase = getSupabase()!;
  const { error } = await supabase.from('prices').update(patch).eq('product_id', productId);
  if (error) throw error;
}

export async function updateProductStock(productId: string, quantity: number): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('Supabase не настроен');
  const supabase = getSupabase()!;
  const { error } = await supabase
    .from('inventory')
    .update({ quantity })
    .eq('product_id', productId);
  if (error) throw error;
}

export async function fetchMySupplierProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabase()!;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('products')
    .select(productSelect)
    .eq('supplier_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ProductRow[]).map((row) => mapProductRow(row));
}

export type SupplierOrderRow = {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchSupplierOrdersDashboard(): Promise<SupplierOrderRow[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabase()!;
  const { data, error } = await supabase.rpc('supplier_orders_dashboard');
  if (error) throw error;
  if (data == null) return [];
  if (Array.isArray(data)) return data as SupplierOrderRow[];
  return [];
}

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { OrderRow } from '@/types/database';

export type AdminSalesOverview = {
  total_orders: number;
  total_revenue: number;
  orders_last_7d: number;
  pending_integration_events: number;
  pending_notifications: number;
};

export async function fetchAdminSalesOverview(): Promise<AdminSalesOverview | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase()!;
  const { data, error } = await supabase.rpc('admin_sales_overview');
  if (error) throw error;
  const row = data as Record<string, unknown> | null;
  if (!row) return null;
  return {
    total_orders: Number(row.total_orders ?? 0),
    total_revenue: Number(row.total_revenue ?? 0),
    orders_last_7d: Number(row.orders_last_7d ?? 0),
    pending_integration_events: Number(row.pending_integration_events ?? 0),
    pending_notifications: Number(row.pending_notifications ?? 0),
  };
}

export async function adminEnqueueNotification(params: {
  channel: 'push' | 'email' | 'telegram';
  title: string;
  body: string;
  audience?: Record<string, unknown>;
}): Promise<string> {
  if (!isSupabaseConfigured) throw new Error('no supabase');
  const supabase = getSupabase()!;
  const { data, error } = await supabase.rpc('admin_enqueue_notification', {
    p_channel: params.channel,
    p_title: params.title,
    p_body: params.body,
    p_audience: params.audience ?? {},
  });
  if (error) throw error;
  return String(data);
}

/** Массовая скидка: discount_price = base * (1 - percent/100). p_category null/пусто — все товары */
export async function fetchAdminOrders(): Promise<OrderRow[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabase()!;
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(150);
  if (error) throw error;
  return (data ?? []) as OrderRow[];
}

export async function adminSetOrderStatus(orderId: string, status: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error('no supabase');
  const supabase = getSupabase()!;
  const { error } = await supabase.rpc('admin_set_order_status', {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) throw error;
}

export async function adminBulkApplyDiscountPercent(
  category: string | null,
  percent: number
): Promise<number> {
  if (!isSupabaseConfigured) throw new Error('no supabase');
  const supabase = getSupabase()!;
  const { data, error } = await supabase.rpc('admin_bulk_apply_discount_percent', {
    p_category: category && category.trim() !== '' ? category : null,
    p_percent: percent,
  });
  if (error) throw error;
  return Number(data ?? 0);
}

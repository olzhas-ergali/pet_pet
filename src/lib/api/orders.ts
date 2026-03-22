import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { OrderRow } from '@/types/database';
import type { ValidateCartResult } from '@/lib/api/orderErrors';
import { isBffEnabled, bffFetchJson, bffValidateCart } from '@/lib/api/bff';
import { isBffClientError } from '@/lib/api/bffClientError';

export type CartLineInput = { product_id: string; quantity: number };

export type OrderSubmitMeta = {
  recipient_phone?: string;
  shipping_address?: Record<string, string>;
};

export async function validateCartStock(lines: CartLineInput[]): Promise<ValidateCartResult> {
  if (!isSupabaseConfigured) return { ok: false, code: 'no_config' };

  if (isBffEnabled()) {
    try {
      return await bffValidateCart(lines);
    } catch (e) {
      if (isBffClientError(e)) {
        if (e.kind === 'unauthorized') return { ok: false, code: 'auth_required' };
        if (e.kind === 'network' || e.kind === 'unavailable') return { ok: false, code: 'bff_unavailable' };
      }
      return { ok: false, code: 'rpc_error' };
    }
  }

  const supabase = getSupabase()!;
  const { data, error } = await supabase.rpc('validate_cart_stock', {
    p_items: lines,
  });
  if (error) {
    return { ok: false, code: 'rpc_error' };
  }
  const row = (typeof data === 'string' ? JSON.parse(data) : data) as {
    ok?: boolean;
    code?: string;
    issues?: unknown;
  };
  if (row?.ok === true) return { ok: true };
  const issues = Array.isArray(row?.issues)
    ? (row.issues as { product_id: string; available: number; requested: number }[])
    : undefined;
  return {
    ok: false,
    code: row?.code ?? 'unknown',
    issues,
  };
}

export async function submitOrder(lines: CartLineInput[], meta?: OrderSubmitMeta): Promise<string> {
  if (!isSupabaseConfigured) throw new Error('Supabase не настроен');

  if (isBffEnabled()) {
    const { orderId } = await bffFetchJson<{ orderId: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify({ lines, meta: meta ?? {} }),
    });
    return orderId;
  }

  const supabase = getSupabase()!;
  const { data, error } = await supabase.rpc('submit_order', {
    p_items: lines,
    p_meta: meta ?? {},
  });
  if (error) throw error;
  return data as string;
}

export async function fetchMyOrders(): Promise<OrderRow[]> {
  if (!isSupabaseConfigured) return [];

  if (isBffEnabled()) {
    const { data } = await bffFetchJson<{ data: OrderRow[] }>('/orders');
    return data ?? [];
  }

  const supabase = getSupabase()!;
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrderRow[];
}

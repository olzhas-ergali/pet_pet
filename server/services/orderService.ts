import type { SupabaseClient } from '@supabase/supabase-js';
import { createPaymentIntentStub } from '../integrations/payments.js';
import { scheduleDeliveryStub } from '../integrations/delivery.js';
import { notifyTelegramStub } from '../integrations/telegram.js';

export type CartLine = { product_id: string; quantity: number };

export async function validateCartStockRpc(supabase: SupabaseClient, lines: CartLine[]) {
  const { data, error } = await supabase.rpc('validate_cart_stock', { p_items: lines });
  if (error) throw error;
  return typeof data === 'string' ? JSON.parse(data) : data;
}

export async function submitOrderRpc(supabase: SupabaseClient, lines: CartLine[]) {
  const { data, error } = await supabase.rpc('submit_order', { p_items: lines });
  if (error) throw error;
  return data as string;
}

export async function runPostOrderIntegrations(orderId: string, totalAmount: number) {
  await createPaymentIntentStub({ orderId, amount: totalAmount, currency: 'KZT' });
  await scheduleDeliveryStub(orderId, { source: 'bff' });
  await notifyTelegramStub(`Новый заказ ${orderId.slice(0, 8)} на сумму ${totalAmount}`);
  try {
    const { dispatchPendingIntegrationEvents } = await import('./eventDispatcher.js');
    await dispatchPendingIntegrationEvents(10);
  } catch {
    /* service role может быть не задан локально */
  }
}

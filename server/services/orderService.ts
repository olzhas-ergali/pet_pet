import type { SupabaseClient } from '@supabase/supabase-js';
import { createPaymentIntentStub } from '../integrations/payments.js';
import { scheduleDeliveryStub } from '../integrations/delivery.js';
import { notifyTelegramStub } from '../integrations/telegram.js';
import { createAdminClient } from '../lib/supabaseClients.js';

export type CartLine = { product_id: string; quantity: number };

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function validateCartStockRpc(supabase: SupabaseClient, lines: CartLine[]) {
  const { data, error } = await supabase.rpc('validate_cart_stock', { p_items: lines });
  if (error) throw error;
  return typeof data === 'string' ? JSON.parse(data) : data;
}

export async function submitOrderRpc(
  supabase: SupabaseClient,
  lines: CartLine[],
  meta?: Record<string, unknown>
) {
  const { data, error } = await supabase.rpc('submit_order', {
    p_items: lines,
    p_meta: meta ?? {},
  });
  if (error) throw error;
  return data as string;
}

async function formatOrderTelegramSummary(
  admin: SupabaseClient,
  orderId: string,
  totalAmount: number
): Promise<string> {
  const { data: rows, error } = await admin.from('order_items').select('quantity, price_at_time, products(name)').eq('order_id', orderId);
  if (error || !rows?.length) {
    return `Новый заказ ${orderId.slice(0, 8)} · ${totalAmount} ₸`;
  }
  type ItemRow = {
    quantity: number;
    price_at_time: number;
    products: { name: string } | { name: string }[] | null;
  };
  const lines = (rows as ItemRow[]).map((r) => {
    const rel = r.products;
    const name =
      Array.isArray(rel) ? (rel[0]?.name ?? '—') : (rel?.name ?? '—');
    return `· ${name} ×${r.quantity} @ ${r.price_at_time}`;
  });
  return [`Заказ ${orderId.slice(0, 8)} · ${totalAmount} ₸`, ...lines].join('\n');
}

/** Автопайплайн: оплата (stub) → трекинг → статусы paid → shipped → completed; уведомление поставщику/оператору */
export async function runPostOrderIntegrations(orderId: string, totalAmount: number) {
  await createPaymentIntentStub({ orderId, amount: totalAmount, currency: 'KZT' });
  const delivery = await scheduleDeliveryStub(orderId, { source: 'bff', stage: 'schedule' });

  let admin: SupabaseClient | null = null;
  try {
    admin = createAdminClient();
  } catch {
    /* SUPABASE_SERVICE_ROLE_KEY не задан — статусы останутся pending, уведомление краткое */
  }

  if (admin) {
    await admin
      .from('orders')
      .update({ status: 'paid', tracking_number: delivery.trackingId })
      .eq('id', orderId);
    await sleep(400);
    await admin.from('orders').update({ status: 'shipped' }).eq('id', orderId);
    await sleep(400);
    await admin.from('orders').update({ status: 'completed' }).eq('id', orderId);
  }

  const telegramText = admin
    ? await formatOrderTelegramSummary(admin, orderId, totalAmount)
    : `Новый заказ ${orderId.slice(0, 8)} на сумму ${totalAmount} (без service role — детали недоступны)`;
  await notifyTelegramStub(telegramText);

  try {
    const { dispatchPendingIntegrationEvents } = await import('./eventDispatcher.js');
    await dispatchPendingIntegrationEvents(10);
  } catch {
    /* service role может быть не задан локально */
  }
}

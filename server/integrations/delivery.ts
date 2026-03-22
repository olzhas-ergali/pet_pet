/** Заглушка доставки — заменить на интеграцию с курьерской службой */

export async function scheduleDeliveryStub(orderId: string, meta: Record<string, unknown>) {
  console.info('[delivery:stub] schedule', orderId, meta);
  return { trackingId: `TRK-${orderId.slice(0, 8)}`, etaDays: 2 };
}

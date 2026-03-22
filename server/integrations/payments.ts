/** Заглушка оплаты (Kaspi / эквайринг) — заменить на реальный адаптер */

export type PaymentIntentStub = { orderId: string; amount: number; currency: 'KZT' };

export async function createPaymentIntentStub(intent: PaymentIntentStub): Promise<{ id: string }> {
  console.info('[payments:stub] intent', intent);
  return { id: `pay_stub_${intent.orderId.slice(0, 8)}` };
}

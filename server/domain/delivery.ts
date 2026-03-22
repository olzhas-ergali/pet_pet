/** Правила доставки — только на backend; фронт показывает ответ BFF */

export function deliveryFeeKzt(subtotal: number): number {
  return subtotal > 10000 ? 0 : 500;
}

import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cartStore';

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it('addToCart и setQuantity', () => {
    useCartStore.getState().addToCart({
      productId: 'p1',
      name: 'Test',
      image: '',
      quantity: 2,
    });
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
    useCartStore.getState().setQuantity('p1', 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('removeFromCart', () => {
    useCartStore.getState().addToCart({ productId: 'a', name: 'A', image: '', quantity: 1 });
    useCartStore.getState().removeFromCart('a');
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('clearCart', () => {
    useCartStore.getState().addToCart({ productId: 'a', name: 'A', image: '', quantity: 1 });
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('нормализует количество: 0 и отрицательные при добавлении → минимум 1', () => {
    useCartStore.getState().addToCart({ productId: 'p', name: 'P', image: '', quantity: 0 });
    expect(useCartStore.getState().items[0].quantity).toBe(1);
    useCartStore.getState().clearCart();
    useCartStore.getState().addToCart({ productId: 'p', name: 'P', image: '', quantity: -3 });
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it('setQuantity 0 убирает позицию', () => {
    useCartStore.getState().addToCart({ productId: 'p', name: 'P', image: '', quantity: 2 });
    useCartStore.getState().setQuantity('p', 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

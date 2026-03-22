import { create } from 'zustand';
import { submitOrder, type CartLineInput, type OrderSubmitMeta } from '@/lib/api/orders';
import { mapSubmitOrderError } from '@/lib/api/orderErrors';
import { useCartStore } from '@/store/cartStore';

type OrderState = {
  submitting: boolean;
  error: string | null;
  clearOrderError: () => void;
  createOrderFromCart: (lines: CartLineInput[]) => Promise<string>;
};

export const useOrderStore = create<OrderState>((set) => ({
  submitting: false,
  error: null,

  clearOrderError: () => set({ error: null }),

  createOrderFromCart: async (lines, meta) => {
    set({ submitting: true, error: null });
    try {
      const id = await submitOrder(lines, meta);
      useCartStore.getState().clearCart();
      set({ submitting: false, error: null });
      return id;
    } catch (e) {
      const msg = mapSubmitOrderError(e);
      set({ submitting: false, error: msg });
      throw new Error(msg);
    }
  },
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartLine = {
  productId: string;
  name: string;
  image: string;
  quantity: number;
};

type CartState = {
  items: CartLine[];
  addToCart: (line: Omit<CartLine, 'quantity'> & { quantity?: number }) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addToCart: (line) => {
        const raw = line.quantity ?? 1;
        const qty = Number.isFinite(raw) ? Math.max(1, Math.floor(Number(raw))) : 1;
        set((s) => {
          const idx = s.items.findIndex((i) => i.productId === line.productId);
          if (idx === -1) {
            return {
              items: [
                ...s.items,
                {
                  productId: line.productId,
                  name: line.name,
                  image: line.image,
                  quantity: qty,
                },
              ],
            };
          }
          const next = [...s.items];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
          return { items: next };
        });
      },

      setQuantity: (productId, quantity) => {
        const q = Number.isFinite(quantity) ? Math.max(0, Math.floor(Number(quantity))) : 0;
        set((s) => ({
          items: s.items
            .map((i) => (i.productId === productId ? { ...i, quantity: q } : i))
            .filter((i) => i.quantity > 0),
        }));
      },

      removeFromCart: (productId) => {
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) }));
      },

      clearCart: () => set({ items: [] }),
    }),
    { name: 'optbirja-cart-v1' }
  )
);

export function selectCartCount(state: CartState): number {
  return state.items.reduce((n, i) => n + i.quantity, 0);
}

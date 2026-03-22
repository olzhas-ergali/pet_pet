import { create } from 'zustand';

/** Инкремент при событии Realtime по таблице orders — экраны подписываются и перезагружают список */
type OrderFeedState = {
  tick: number;
  bump: () => void;
};

export const useOrderFeedStore = create<OrderFeedState>((set) => ({
  tick: 0,
  bump: () => set((s) => ({ tick: s.tick + 1 })),
}));

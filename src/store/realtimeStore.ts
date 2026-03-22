import { create } from 'zustand';

export type RealtimeChannelState = 'idle' | 'subscribed' | 'error';

type RealtimeState = {
  pricesChannel: RealtimeChannelState;
  setPricesChannel: (s: RealtimeChannelState) => void;
};

export const useRealtimeStore = create<RealtimeState>((set) => ({
  pricesChannel: 'idle',
  setPricesChannel: (pricesChannel) => set({ pricesChannel }),
}));

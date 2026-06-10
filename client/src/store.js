import { create } from 'zustand';

export const useStore = create((set) => ({
  entries: [],
  stats: [],
  refreshTrigger: 0,
  setMonthData: (entries, stats) => set({ entries, stats }),
  triggerRefresh: () => set(state => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));

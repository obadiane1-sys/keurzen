import { create } from 'zustand';

interface UiState {
  activeToast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeToast: null,
  showToast: (message, type = 'info') =>
    set({ activeToast: { message, type } }),
  hideToast: () => set({ activeToast: null }),
}));

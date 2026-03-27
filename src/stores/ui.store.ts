import { create } from 'zustand';
import { Platform } from 'react-native';

// ─── localStorage helpers (web only) ─────────────────────────────────────────

const INVITE_TOKEN_KEY = 'keurzen_pending_invite_token';

function readTokenFromStorage(): string | null {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem(INVITE_TOKEN_KEY);
  }
  return null;
}

function writeTokenToStorage(token: string | null): void {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    if (token) localStorage.setItem(INVITE_TOKEN_KEY, token);
    else localStorage.removeItem(INVITE_TOKEN_KEY);
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface UiState {
  activeToast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  taskModalOpen: boolean;
  setTaskModalOpen: (open: boolean) => void;
  tlxSheetOpen: boolean;
  setTlxSheetOpen: (open: boolean) => void;
  tourPage: string | null;
  setTourPage: (page: string | null) => void;
  // Token d'invitation en attente de traitement (deep link reçu avant auth).
  // Sur web, également persisté dans localStorage pour survivre aux rechargements
  // de page (ex : clic sur le lien de confirmation email de Supabase).
  pendingInviteToken: string | null;
  setPendingInviteToken: (token: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeToast: null,
  showToast: (message, type = 'info') =>
    set({ activeToast: { message, type } }),
  hideToast: () => set({ activeToast: null }),

  taskModalOpen: false,
  setTaskModalOpen: (taskModalOpen) => set({ taskModalOpen }),

  tlxSheetOpen: false,
  setTlxSheetOpen: (tlxSheetOpen) => set({ tlxSheetOpen }),

  tourPage: null,
  setTourPage: (tourPage) => set({ tourPage }),

  // Initialise depuis localStorage si disponible (web, après rechargement)
  pendingInviteToken: readTokenFromStorage(),
  setPendingInviteToken: (pendingInviteToken) => {
    writeTokenToStorage(pendingInviteToken);
    set({ pendingInviteToken });
  },
}));

import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  needsPasswordSetup: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setNeedsPasswordSetup: (value: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
  needsPasswordSetup: false,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  setProfile: (profile) =>
    set({ profile }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  setInitialized: (isInitialized) =>
    set({ isInitialized }),

  setNeedsPasswordSetup: (needsPasswordSetup) =>
    set({ needsPasswordSetup }),

  reset: () =>
    set({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      needsPasswordSetup: false,
    }),
}));

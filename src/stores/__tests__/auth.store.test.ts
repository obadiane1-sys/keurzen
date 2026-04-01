import { useAuthStore } from '../../stores/auth.store';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../../types';

const mockUser: User = {
  id: 'user-123',
  email: 'alice@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
} as User;

const mockSession: Session = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser,
} as Session;

const mockProfile: Profile = {
  id: 'user-123',
  email: 'alice@example.com',
  full_name: 'Alice Dupont',
  avatar_url: null,
  has_seen_onboarding: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  useAuthStore.setState({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    isInitialized: false,
  });
});

describe('useAuthStore', () => {
  it('has correct initial state', () => {
    const state = useAuthStore.getState();

    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.isLoading).toBe(true);
    expect(state.isInitialized).toBe(false);
  });

  it('setSession updates session and derives user', () => {
    useAuthStore.getState().setSession(mockSession);

    const state = useAuthStore.getState();
    expect(state.session).toBe(mockSession);
    expect(state.user).toBe(mockUser);
  });

  it('setSession(null) clears session and user', () => {
    useAuthStore.getState().setSession(mockSession);
    useAuthStore.getState().setSession(null);

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
  });

  it('setProfile updates profile', () => {
    useAuthStore.getState().setProfile(mockProfile);

    expect(useAuthStore.getState().profile).toBe(mockProfile);
  });

  it('setLoading updates isLoading', () => {
    useAuthStore.getState().setLoading(false);

    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('setInitialized updates isInitialized', () => {
    useAuthStore.getState().setInitialized(true);

    expect(useAuthStore.getState().isInitialized).toBe(true);
  });

  it('reset clears session, user, profile and sets isLoading to false', () => {
    // Set some state first
    useAuthStore.getState().setSession(mockSession);
    useAuthStore.getState().setProfile(mockProfile);
    useAuthStore.getState().setInitialized(true);

    useAuthStore.getState().reset();

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.isLoading).toBe(false);
  });
});

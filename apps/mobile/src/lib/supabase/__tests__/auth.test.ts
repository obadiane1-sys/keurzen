import {
  sendOtpForLogin,
  sendOtp,
  verifyOtp,
  signUp,
  signOut,
  fetchProfile,
  updateProfile,
} from '../auth';

jest.mock('../client', () => ({
  supabase: {
    rpc: jest.fn(),
    auth: {
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const { supabase } = require('../client');

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── sendOtpForLogin ──────────────────────────────────────────────────────────

describe('sendOtpForLogin', () => {
  it('sends OTP when email is registered', async () => {
    supabase.rpc.mockResolvedValue({ data: true });
    supabase.auth.signInWithOtp.mockResolvedValue({ error: null });

    const result = await sendOtpForLogin('user@example.com');

    expect(supabase.rpc).toHaveBeenCalledWith('check_email_registered', {
      p_email: 'user@example.com',
    });
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      options: { shouldCreateUser: false },
    });
    expect(result).toEqual({ error: null });
  });

  it('returns error when email is not registered', async () => {
    supabase.rpc.mockResolvedValue({ data: false });

    const result = await sendOtpForLogin('unknown@example.com');

    expect(supabase.rpc).toHaveBeenCalledWith('check_email_registered', {
      p_email: 'unknown@example.com',
    });
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled();
    expect(result).toEqual({
      error: 'Aucun compte trouvé avec cette adresse. Créez un compte.',
    });
  });

  it('returns error when RPC succeeds but signInWithOtp fails', async () => {
    supabase.rpc.mockResolvedValue({ data: true });
    supabase.auth.signInWithOtp.mockResolvedValue({
      error: { message: 'Rate limit exceeded' },
    });

    const result = await sendOtpForLogin('user@example.com');

    expect(result).toEqual({ error: 'Rate limit exceeded' });
  });
});

// ─── sendOtp ──────────────────────────────────────────────────────────────────

describe('sendOtp', () => {
  it('sends OTP successfully with shouldCreateUser: true', async () => {
    supabase.auth.signInWithOtp.mockResolvedValue({ error: null });

    const result = await sendOtp('new@example.com');

    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'new@example.com',
      options: { shouldCreateUser: true },
    });
    expect(result).toEqual({ error: null });
  });

  it('returns error when signInWithOtp fails', async () => {
    supabase.auth.signInWithOtp.mockResolvedValue({
      error: { message: 'Service unavailable' },
    });

    const result = await sendOtp('new@example.com');

    expect(result).toEqual({ error: 'Service unavailable' });
  });
});

// ─── verifyOtp ────────────────────────────────────────────────────────────────

describe('verifyOtp', () => {
  it('verifies OTP successfully', async () => {
    supabase.auth.verifyOtp.mockResolvedValue({ error: null });

    const result = await verifyOtp('user@example.com', '123456');

    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      token: '123456',
      type: 'email',
    });
    expect(result).toEqual({ error: null });
  });

  it('returns translated message when token is expired', async () => {
    supabase.auth.verifyOtp.mockResolvedValue({
      error: { message: 'Token has expired' },
    });

    const result = await verifyOtp('user@example.com', '000000');

    expect(result).toEqual({
      error: 'Code invalide ou expiré. Demandez un nouveau code.',
    });
  });

  it('returns translated message when token is invalid', async () => {
    supabase.auth.verifyOtp.mockResolvedValue({
      error: { message: 'Token is invalid' },
    });

    const result = await verifyOtp('user@example.com', '999999');

    expect(result).toEqual({
      error: 'Code invalide ou expiré. Demandez un nouveau code.',
    });
  });

  it('returns raw error message for other errors', async () => {
    supabase.auth.verifyOtp.mockResolvedValue({
      error: { message: 'Database connection failed' },
    });

    const result = await verifyOtp('user@example.com', '123456');

    expect(result).toEqual({ error: 'Database connection failed' });
  });
});

// ─── signUp ───────────────────────────────────────────────────────────────────

describe('signUp', () => {
  it('signs up successfully with full name metadata', async () => {
    supabase.auth.signInWithOtp.mockResolvedValue({ error: null });

    const result = await signUp('new@example.com', 'Alice Dupont');

    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'new@example.com',
      options: {
        shouldCreateUser: true,
        data: { full_name: 'Alice Dupont' },
      },
    });
    expect(result).toEqual({ error: null });
  });

  it('returns error when signup fails', async () => {
    supabase.auth.signInWithOtp.mockResolvedValue({
      error: { message: 'User already registered' },
    });

    const result = await signUp('existing@example.com', 'Alice');

    expect(result).toEqual({ error: 'User already registered' });
  });
});

// ─── signOut ──────────────────────────────────────────────────────────────────

describe('signOut', () => {
  it('calls supabase.auth.signOut', async () => {
    supabase.auth.signOut.mockResolvedValue({});

    await signOut();

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});

// ─── fetchProfile ─────────────────────────────────────────────────────────────

describe('fetchProfile', () => {
  it('returns profile when found', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'user@example.com',
      full_name: 'Alice',
      avatar_url: null,
      has_seen_onboarding: false,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };

    const singleMock = jest.fn().mockResolvedValue({ data: mockProfile, error: null });
    const eqMock = jest.fn().mockReturnValue({ single: singleMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    supabase.from.mockReturnValue({ select: selectMock });

    const result = await fetchProfile('user-123');

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(selectMock).toHaveBeenCalledWith('*');
    expect(eqMock).toHaveBeenCalledWith('id', 'user-123');
    expect(result).toEqual(mockProfile);
  });

  it('returns null when profile is not found', async () => {
    const singleMock = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
    });
    const eqMock = jest.fn().mockReturnValue({ single: singleMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    supabase.from.mockReturnValue({ select: selectMock });

    const result = await fetchProfile('nonexistent');

    expect(result).toBeNull();
  });
});

// ─── updateProfile ────────────────────────────────────────────────────────────

describe('updateProfile', () => {
  it('updates profile successfully', async () => {
    const eqMock = jest.fn().mockResolvedValue({ error: null });
    const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
    supabase.from.mockReturnValue({ update: updateMock });

    const result = await updateProfile('user-123', { full_name: 'Bob' });

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: 'Bob', updated_at: expect.any(String) }),
    );
    expect(eqMock).toHaveBeenCalledWith('id', 'user-123');
    expect(result).toEqual({ error: null });
  });

  it('returns error when update fails', async () => {
    const eqMock = jest.fn().mockResolvedValue({
      error: { message: 'Permission denied' },
    });
    const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
    supabase.from.mockReturnValue({ update: updateMock });

    const result = await updateProfile('user-123', { full_name: 'Bob' });

    expect(result).toEqual({ error: 'Permission denied' });
  });
});

import { supabase } from './client';
import type { Profile } from '../../types';

// ─── Send OTP ─────────────────────────────────────────────────────────────────

/**
 * Envoie un code OTP pour la connexion (compte existant uniquement).
 * Vérifie d'abord qu'un profil complet (full_name renseigné) existe —
 * les ghost users créés par signInWithOtp n'ont pas de full_name.
 */
export async function sendOtpForLogin(email: string): Promise<{ error: string | null }> {
  // Vérifier qu'un profil complet existe via RPC (bypass RLS, safe côté anonyme)
  const { data: isRegistered } = await supabase.rpc('check_email_registered', {
    p_email: email,
  });

  if (!isRegistered) {
    return { error: 'Aucun compte trouvé avec cette adresse. Créez un compte.' };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

/**
 * Envoie un code OTP en créant le compte si nécessaire (signup + resend après signup).
 */
export async function sendOtp(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) return { error: error.message };
  return { error: null };
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export async function verifyOtp(
  email: string,
  token: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('expired') || msg.includes('invalid')) {
      return { error: 'Code invalide ou expiré. Demandez un nouveau code.' };
    }
    return { error: error.message };
  }

  return { error: null };
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────

/**
 * Inscription : envoie un OTP avec le fullName en métadonnée.
 * Le compte sera créé (ou retrouvé) lors de la vérification OTP.
 */
export async function signUp(
  email: string,
  fullName: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: { full_name: fullName },
    },
  });

  if (error) return { error: error.message };
  return { error: null };
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: { full_name?: string; avatar_url?: string }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function markOnboardingSeen(userId: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({ has_seen_onboarding: true, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

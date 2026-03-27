import { supabase, supabaseAnonKey } from './client';
import type { Profile } from '../../types';

// ─── Password Validation ──────────────────────────────────────────────────────

/**
 * Règles de mot de passe Keurzen :
 * - min 12 caractères
 * - au moins 1 minuscule, 1 majuscule, 1 chiffre, 1 caractère spécial
 * - pas d'espaces
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 12) errors.push('Au moins 12 caractères');
  if (!/[a-z]/.test(password)) errors.push('Au moins une minuscule');
  if (!/[A-Z]/.test(password)) errors.push('Au moins une majuscule');
  if (!/[0-9]/.test(password)) errors.push('Au moins un chiffre');
  if (!/[^a-zA-Z0-9]/.test(password)) errors.push('Au moins un caractère spécial (!@#$%...)');
  if (/\s/.test(password)) errors.push('Pas d\'espaces autorisés');

  return { valid: errors.length === 0, errors };
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<{ error: string | null; requiresConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      // Si la confirmation email est activée côté Supabase, redirige vers notre
      // callback qui reprend le flow proprement (invite ou dashboard).
      emailRedirectTo: 'https://app.keurzen.app/auth/callback',
    },
  });

  if (error) {
    return { error: error.message, requiresConfirmation: false };
  }

  // Quand "Confirm email" est activé, signUp() avec un email déjà utilisé ne
  // retourne PAS d'erreur — il retourne un user avec identities: [] (tableau vide).
  // C'est le seul moyen fiable de détecter un email déjà enregistré dans ce mode.
  if (data.user?.identities?.length === 0) {
    return { error: 'email_already_exists', requiresConfirmation: false };
  }

  // data.session est null quand Supabase attend une confirmation email.
  // data.session est défini quand la confirmation est désactivée (auto-login).
  return { error: null, requiresConfirmation: !data.session };
}

// ─── Sign Up for Invite ───────────────────────────────────────────────────────
//
// Flow d'inscription via invitation :
//   1. Appelle l'Edge Function signup-for-invite qui crée le compte auto-confirmé
//      → aucun email Supabase envoyé
//   2. Connecte immédiatement l'utilisateur via signInWithPassword
//
// À utiliser à la place de signUp() quand pendingInviteToken est présent.

export async function signUpForInvite(
  email: string,
  password: string,
  fullName: string,
  inviteToken: string,
): Promise<{ error: string | null }> {
  // 1. Créer le compte (auto-confirmé, sans email de confirmation)
  // L'utilisateur n'est pas encore authentifié — on passe explicitement l'anon
  // key comme Bearer token pour que le proxy Supabase accepte la requête POST.
  const { data: result, error: fnError } = await supabase.functions.invoke(
    'signup-for-invite',
    {
      body: { email, password, full_name: fullName, invite_token: inviteToken },
      headers: { Authorization: `Bearer ${supabaseAnonKey}` },
    },
  );

  if (fnError) {
    const errorBody = await (fnError.context as Response | undefined)?.json?.().catch(() => null) as { error?: string } | null;
    return { error: errorBody?.error ?? fnError.message };
  }

  const payload = result as { success?: boolean; error?: string } | null;
  if (payload?.error) return { error: payload.error };

  // 2. Connexion immédiate
  return signIn(email, password);
}

// ─── Sign In ──────────────────────────────────────────────────────────────────

export async function signIn(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Normalize error message for security (ne pas révéler si l'email existe)
    if (
      error.message.toLowerCase().includes('invalid') ||
      error.message.toLowerCase().includes('invalid login')
    ) {
      return { error: 'Email ou mot de passe incorrect.' };
    }
    return { error: error.message };
  }

  return { error: null };
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ─── Reset Password ───────────────────────────────────────────────────────────

/**
 * Envoie un email de reset UNIQUEMENT si l'adresse existe dans la base.
 * L'interface affiche TOUJOURS un message générique pour des raisons de sécurité.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  // On envoie silencieusement — pas d'exposition de l'existence de l'email.
  // Sur web : HTTPS vers /auth/callback?type=recovery
  // Sur mobile : deep link keurzen://
  const { Platform } = await import('react-native');
  const redirectTo = Platform.OS === 'web'
    ? 'https://app.keurzen.app/auth/callback'
    : 'keurzen://reset-password';

  await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  // Intentionally no error thrown — always show generic message
}

// ─── Update Password ──────────────────────────────────────────────────────────

export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { error: null };
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

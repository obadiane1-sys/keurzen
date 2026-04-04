/**
 * Keurzen — Edge Function: verify-email-code
 *
 * STATUS: VESTIGE — Cette Edge Function fait partie du systeme OTP custom
 * (send-confirmation-email + verify-email-code + table email_verifications)
 * qui n'est plus appele par l'application mobile.
 *
 * L'app utilise desormais exclusivement le systeme OTP natif de Supabase :
 *   - signInWithOtp() pour l'envoi (login et signup)
 *   - verifyOtp() pour la verification
 *   Voir : src/lib/supabase/auth.ts
 *
 * Cette fonction est conservee pour reference et au cas ou le systeme custom
 * serait reactive (ex: besoin de confirmer l'email via un code envoye par Resend).
 * Ne pas supprimer sans verifier qu'aucun workflow externe ne l'appelle.
 *
 * ---
 *
 * Vérifie le code OTP saisi par l'utilisateur et confirme son email côté Supabase.
 *
 * Flow :
 *   1. Reçoit { email, code } dans le body (pas de JWT requis)
 *   2. Cherche le code dans email_verifications (non expiré, non déjà utilisé)
 *   3. Si trouvé → marque verified = true + confirme l'email via admin.updateUserById
 *   4. Retourne { success: true }
 *
 * Déploiement : npx supabase functions deploy verify-email-code --no-verify-jwt
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CORS ─────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // ── Env ───────────────────────────────────────────────────────────────────

  const supabaseUrl    = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // ── Body ──────────────────────────────────────────────────────────────────

  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps de requête invalide' }, 400);
  }

  const { email, code } = body;
  if (!email || !code) {
    return json({ error: 'email et code requis' }, 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // ── Chercher le code valide ───────────────────────────────────────────────

  const { data: verification, error: fetchError } = await adminClient
    .from('email_verifications')
    .select('id, code, expires_at, verified')
    .eq('email', normalizedEmail)
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error('Fetch verification error:', fetchError.message);
    return json({ error: 'Erreur interne' }, 500);
  }

  if (!verification) {
    return json({ error: 'Code invalide ou expiré' }, 400);
  }

  // Vérification expiration
  if (new Date(verification.expires_at) < new Date()) {
    return json({ error: 'Code expiré. Demandez un nouveau code.' }, 400);
  }

  // Vérification du code (comparaison simple — pas de timing attack risk car 6 digits)
  if (verification.code !== code.trim()) {
    return json({ error: 'Code incorrect' }, 400);
  }

  // ── Marquer le code comme utilisé ────────────────────────────────────────

  await adminClient
    .from('email_verifications')
    .update({ verified: true })
    .eq('id', verification.id);

  // ── Confirmer l'email dans Supabase Auth ──────────────────────────────────

  // Lookup user_id via profiles table (scalable, no full user list scan)
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (profileError) {
    console.error('Profile lookup error:', profileError.message);
    return json({ error: 'Erreur lors de la confirmation du compte' }, 500);
  }

  if (!profile) {
    console.error('Profile not found for email:', normalizedEmail);
    return json({ error: 'Utilisateur introuvable' }, 404);
  }

  // Fetch the auth user by ID to check email_confirmed_at
  const { data: authUser, error: getUserError } = await adminClient.auth.admin.getUserById(
    profile.id,
  );

  if (getUserError) {
    console.error('getUserById error:', getUserError.message);
    return json({ error: 'Erreur lors de la confirmation du compte' }, 500);
  }

  if (!authUser.user.email_confirmed_at) {
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      profile.id,
      { email_confirm: true },
    );

    if (updateError) {
      console.error('updateUserById error:', updateError.message);
      return json({ error: 'Erreur lors de la confirmation du compte' }, 500);
    }
  }

  console.log(`Email confirmed for ${normalizedEmail} (user: ${profile.id})`);
  return json({ success: true });
});

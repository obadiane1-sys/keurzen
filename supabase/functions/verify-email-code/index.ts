/**
 * Keurzen — Edge Function: verify-email-code
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

  // Récupérer l'utilisateur par email
  const { data: usersPage, error: listError } = await adminClient.auth.admin.listUsers();

  if (listError) {
    console.error('listUsers error:', listError.message);
    return json({ error: 'Erreur lors de la confirmation du compte' }, 500);
  }

  const user = usersPage.users.find(
    (u) => u.email?.toLowerCase() === normalizedEmail,
  );

  if (!user) {
    console.error('User not found for email:', normalizedEmail);
    return json({ error: 'Utilisateur introuvable' }, 404);
  }

  if (!user.email_confirmed_at) {
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { email_confirm: true },
    );

    if (updateError) {
      console.error('updateUserById error:', updateError.message);
      return json({ error: 'Erreur lors de la confirmation du compte' }, 500);
    }
  }

  console.log(`Email confirmed for ${normalizedEmail} (user: ${user.id})`);
  return json({ success: true });
});

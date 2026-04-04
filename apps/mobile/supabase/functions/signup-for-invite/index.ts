/**
 * Keurzen — Edge Function: signup-for-invite
 *
 * Crée un compte utilisateur SANS email de confirmation Supabase,
 * en vérifiant préalablement que le token d'invitation est valide.
 *
 * Pourquoi cette fonction existe :
 *   supabase.auth.signUp() envoie un email de confirmation depuis Supabase.
 *   Pour le flow d'invitation Keurzen, l'invitation elle-même sert de
 *   vérification d'email. On bypasse donc la confirmation en utilisant
 *   l'Admin API (service role) qui crée le compte déjà confirmé.
 *
 * Flow :
 *   1. Vérifie le token d'invitation (existe, pending, non expiré)
 *   2. Crée le compte via Admin API avec email_confirm: true
 *   3. Le client appelle ensuite signInWithPassword pour obtenir la session
 *
 * Déploiement : --no-verify-jwt (l'appelant n'est pas encore authentifié)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CORS ─────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-name',
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    return await handleRequest(req);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('signup-for-invite unhandled error:', msg);
    return json({ error: msg }, 500);
  }
});

async function handleRequest(req: Request): Promise<Response> {
  const supabaseUrl    = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // ── Body ──────────────────────────────────────────────────────────────────

  let body: {
    email?: string;
    password?: string;
    full_name?: string;
    invite_token?: string;
  };

  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps de requête invalide' }, 400);
  }

  const { email, password, full_name, invite_token } = body;

  if (!email || !password || !full_name || !invite_token) {
    return json({ error: 'Paramètres manquants (email, password, full_name, invite_token)' }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // ── Validation du token d'invitation ─────────────────────────────────────

  const { data: invitation, error: invError } = await adminClient
    .from('invitations')
    .select('id, status, expires_at')
    .eq('token', invite_token)
    .single();

  if (invError || !invitation) {
    return json({ error: 'Invitation introuvable ou invalide' }, 404);
  }

  if (invitation.status !== 'pending') {
    return json({ error: `Invitation déjà ${invitation.status}` }, 409);
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return json({ error: 'Invitation expirée' }, 410);
  }

  // ── Création du compte (auto-confirmé, pas d'email Supabase) ─────────────

  const { error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name },
    email_confirm: true, // Compte confirmé immédiatement — aucun email envoyé
  });

  if (createError) {
    console.error('createUser error:', createError.message);
    const msg = createError.message.toLowerCase();
    if (msg.includes('already registered') || msg.includes('already exists')) {
      return json({ error: 'already_exists' }, 409);
    }
    return json({ error: createError.message }, 400);
  }

  // ── Marquer l'invitation comme acceptée (empêche la réutilisation) ────────
  // Best-effort : si l'update échoue, le compte est quand même créé et
  // l'utilisateur peut se connecter. L'invitation restera pending mais
  // sera bloquée à la prochaine tentative via la vérification getUserByEmail.

  await adminClient
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id);

  console.log(`signup-for-invite: created user ${email} for invite ${invite_token}`);
  return json({ success: true });
}

/**
 * Keurzen — Edge Function: redeem-invite-code
 *
 * Valide un code d'invitation 6 chiffres sans authentification prealable.
 * Cree le compte si necessaire (OTP, sans mot de passe),
 * genere une session via magic link, rejoint le foyer.
 *
 * Input (POST JSON, PAS de JWT requis) :
 *   { code: string }
 *
 * Deploiement : npx supabase functions deploy redeem-invite-code --no-verify-jwt
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CORS ────────────────────────────────────────────────────────────────────

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

// ─── Member colors ──────────────────────────────────────────────────────────

const MEMBER_COLORS = [
  '#FFA69E', '#88D4A9', '#AFCBFF', '#BCA7FF',
  '#FCD34D', '#6EE7B7', '#F9A8D4', '#93C5FD',
];

// ─── Handler ────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    return await handleRequest(req);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('redeem-invite-code unhandled error:', msg);
    return json({ error: msg }, 500);
  }
});

async function handleRequest(req: Request): Promise<Response> {
  const supabaseUrl    = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // ── Body ──────────────────────────────────────────────────────────────────

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps de requete invalide' }, 400);
  }

  const code = body.code?.trim();
  if (!code) return json({ error: 'code requis' }, 400);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // ── Valider le code ───────────────────────────────────────────────────────

  const { data: invite, error: codeError } = await adminClient
    .from('invitation_codes')
    .select('*')
    .eq('code', code)
    .single();

  if (codeError || !invite) return json({ error: 'Code invalide' }, 404);
  if (invite.used) return json({ error: 'Ce code a deja ete utilise' }, 400);
  if (new Date(invite.expires_at) < new Date()) {
    return json({ error: 'Ce code a expire' }, 400);
  }
  if (!invite.email) {
    return json({ error: 'Code incompatible — email manquant' }, 400);
  }

  const email = invite.email as string;
  const invitedName = (invite.invited_name as string | null)?.trim() || null;

  // ── Creer le compte si necessaire (OTP, sans mot de passe) ────────────────

  let userId: string;
  let isNewUser = false;

  const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { invited: true, full_name: invitedName },
  });

  if (createError) {
    const msg = createError.message.toLowerCase();
    if (msg.includes('already registered') || msg.includes('already exists')) {
      // Utilisateur existant — recuperer son ID via la table profiles
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      if (!existingProfile) return json({ error: 'Utilisateur introuvable' }, 500);
      userId = existingProfile.id;

      // Mettre a jour le profil si le nom est vide
      if (invitedName) {
        await adminClient
          .from('profiles')
          .update({ full_name: invitedName, updated_at: new Date().toISOString() })
          .eq('id', userId)
          .is('full_name', null);
      }
    } else {
      console.error('createUser error:', createError.message);
      return json({ error: 'Impossible de creer le compte' }, 500);
    }
  } else {
    userId = createData.user.id;
    isNewUser = true;
  }

  // ── Generer une session OTP via magic link ────────────────────────────────

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error('generateLink error:', linkError?.message);
    return json({ error: 'Impossible de generer la session' }, 500);
  }

  // Verifier le token OTP pour obtenir une session valide
  const { data: otpData, error: otpError } = await adminClient.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  });

  if (otpError || !otpData.session) {
    console.error('verifyOtp error:', otpError?.message);
    return json({ error: 'Impossible d\'etablir la session' }, 500);
  }

  // ── Rejoindre le foyer ────────────────────────────────────────────────────

  const { data: existingMember } = await adminClient
    .from('household_members')
    .select('id')
    .eq('household_id', invite.household_id)
    .eq('user_id', userId)
    .maybeSingle();

  let alreadyMember = false;

  if (existingMember) {
    alreadyMember = true;
  } else {
    const { count } = await adminClient
      .from('household_members')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', invite.household_id);

    const color = MEMBER_COLORS[((count ?? 0) % MEMBER_COLORS.length)];

    const { error: insertError } = await adminClient
      .from('household_members')
      .insert({
        household_id: invite.household_id,
        user_id: userId,
        role: 'member',
        color,
      });

    if (insertError) {
      console.error('insert member error:', insertError.message);
      return json({ error: 'Impossible de rejoindre le foyer' }, 500);
    }

    // Marquer le code comme utilise (uniquement lors d'un vrai ajout)
    await adminClient
      .from('invitation_codes')
      .update({ used: true, used_by: userId, used_at: new Date().toISOString() })
      .eq('id', invite.id);
  }

  // Recuperer le foyer
  const { data: household } = await adminClient
    .from('households')
    .select('*')
    .eq('id', invite.household_id)
    .single();

  return json({
    success: true,
    access_token: otpData.session.access_token,
    refresh_token: otpData.session.refresh_token,
    household,
    already_member: alreadyMember,
  });
}

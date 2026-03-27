/**
 * Keurzen — Edge Function: send-household-invite
 *
 * Envoie un e-mail d'invitation via Resend.
 *
 * Flow :
 *   1. Vérifie l'authentification via le JWT Bearer
 *   2. Récupère l'invitation + foyer + profil de l'inviteur (service role)
 *   3. Vérifie que l'utilisateur authentifié est bien l'auteur de l'invitation
 *   4. Appelle Resend API
 *   5. Retourne { success: true } ou { error: "..." }
 *
 * Secrets requis (Supabase Dashboard → Settings → Edge Functions → Secrets) :
 *   RESEND_API_KEY    — clé API Resend
 *   RESEND_FROM_EMAIL — ex: "Keurzen <invite@keurzen.app>"
 *   APP_BASE_URL      — ex: "keurzen://" ou "https://keurzen.app/"
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CORS headers ─────────────────────────────────────────────────────────────

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

// ─── HTML de l'e-mail ─────────────────────────────────────────────────────────

function buildEmailHtml(inviterName: string, householdName: string, inviteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitation Keurzen</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F9FC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F9FC;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(33,46,68,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#212E44;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Keurzen</p>
              <p style="margin:6px 0 0;font-size:13px;color:#88D4A9;letter-spacing:0.5px;">Gestion de foyer partagée</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1E293B;">
                Vous êtes invité(e) à rejoindre un foyer
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#64748B;line-height:1.6;">
                <strong style="color:#1E293B;">${inviterName}</strong> vous invite à rejoindre le foyer
                <strong style="color:#1E293B;">${householdName}</strong> sur Keurzen.
                Un simple clic suffit — aucun mot de passe requis.
              </p>

              <!-- CTA unique -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center" bgcolor="#88D4A9" style="background-color:#88D4A9;border-radius:12px;">
                    <a href="${inviteUrl}" target="_blank"
                       style="display:inline-block;padding:16px 36px;font-size:16px;font-weight:700;color:#212E44;text-decoration:none;border-radius:12px;">
                      Rejoindre le foyer de ${householdName} →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#94A3B8;">
                Ce lien est à <strong>usage unique</strong> et expire dans <strong>1 heure</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F7F9FC;padding:20px 40px;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center;">
                Si vous ne souhaitez pas rejoindre ce foyer, ignorez simplement cet e-mail.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // ── Env ───────────────────────────────────────────────────────────────────

  const supabaseUrl    = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendApiKey   = Deno.env.get('RESEND_API_KEY');
  const fromEmail      = Deno.env.get('RESEND_FROM_EMAIL');

  if (!resendApiKey || !fromEmail) {
    console.error('Missing RESEND_API_KEY or RESEND_FROM_EMAIL');
    return json({ error: 'Configuration serveur incomplète' }, 500);
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  const authHeader = req.headers.get('Authorization') ?? req.headers.get('authorization');
  if (!authHeader) {
    console.error('Auth: no Authorization header');
    return json({ error: 'Non authentifié' }, 401);
  }

  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    console.error('Auth: getUser failed', authError?.message ?? 'no user');
    return json({ error: 'Token invalide', detail: authError?.message }, 401);
  }

  // ── Body ──────────────────────────────────────────────────────────────────

  let body: { invitation_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps de requête invalide' }, 400);
  }

  const { invitation_id } = body;
  if (!invitation_id) {
    return json({ error: 'invitation_id requis' }, 400);
  }

  // ── Fetch invitation avec joins (service role pour bypasser RLS) ──────────

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: invitation, error: fetchError } = await adminClient
    .from('invitations')
    .select(`
      id,
      email,
      token,
      status,
      expires_at,
      invited_by,
      household:households ( id, name ),
      inviter:profiles!invited_by ( full_name )
    `)
    .eq('id', invitation_id)
    .single();

  if (fetchError || !invitation) {
    console.error('Invitation fetch error:', fetchError);
    return json({ error: 'Invitation introuvable' }, 404);
  }

  // ── Vérification d'autorisation ───────────────────────────────────────────

  if (invitation.invited_by !== user.id) {
    return json({ error: 'Non autorisé' }, 403);
  }

  // ── Vérifications métier ──────────────────────────────────────────────────

  if (invitation.status !== 'pending') {
    return json({ error: `Invitation déjà ${invitation.status}` }, 409);
  }

  if (!invitation.email) {
    return json({ error: 'Aucun e-mail associé à cette invitation' }, 400);
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return json({ error: 'Cette invitation a expiré' }, 410);
  }

  const household = invitation.household as { id: string; name: string } | null;
  const inviter   = invitation.inviter   as { full_name: string | null } | null;

  const householdName = household?.name    ?? 'un foyer';
  const inviterName   = inviter?.full_name ?? 'Un membre de Keurzen';

  // ── Création automatique du compte invité (sans mot de passe) ────────────
  // L'invité n'a pas besoin de s'inscrire manuellement. Le compte est créé ici.
  // Si le compte existe déjà, on ignore l'erreur et on continue.

  const { error: createError } = await adminClient.auth.admin.createUser({
    email: invitation.email,
    email_confirm: true,
    user_metadata: {},
  });

  if (createError) {
    const msg = createError.message.toLowerCase();
    if (!msg.includes('already registered') && !msg.includes('already exists')) {
      console.error('createUser error:', createError.message);
      return json({ error: 'Impossible de créer le compte invité' }, 500);
    }
    console.log(`User already exists for ${invitation.email}, proceeding with magic link`);
  }

  // ── Génération du magic link Supabase ─────────────────────────────────────
  // Le magic link connecte l'invité automatiquement sans mot de passe.
  // redirect_to doit être dans la liste des URLs autorisées Supabase Auth
  // (Dashboard → Auth → URL Configuration → Redirect URLs : ajouter keurzen://*).

  const redirectTo = `https://app.keurzen.app/join/${invitation.token}`;

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: invitation.email,
    options: { redirectTo },
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error('generateLink error:', linkError?.message);
    return json({ error: "Impossible de générer le lien d'invitation" }, 500);
  }

  const inviteUrl = linkData.properties.action_link;

  // ── Appel Resend API ──────────────────────────────────────────────────────

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: invitation.email,
        subject: `${inviterName} vous invite à rejoindre son foyer sur Keurzen`,
        html: buildEmailHtml(inviterName, householdName, inviteUrl),
      }),
    });

    const resendBody = await resendResponse.json().catch(() => ({})) as { id?: string; name?: string; message?: string };

    if (!resendResponse.ok) {
      const reason = resendBody.message ?? resendBody.name ?? `HTTP ${resendResponse.status}`;
      console.error('Resend API error:', reason, resendBody);
      return json({ error: "L'e-mail n'a pas pu être envoyé. Réessayez dans quelques instants." }, 502);
    }

    // ── Mise à jour du statut ────────────────────────────────────────────────

    await adminClient.from('invitations').update({ status: 'sent' }).eq('id', invitation_id);

    // ── Succès ──────────────────────────────────────────────────────────────

    console.log(`Invitation sent: ${invitation_id} → ${invitation.email} (resend_id: ${resendBody.id})`);

    return json({ success: true, resend_id: resendBody.id });
  } catch (err) {
    console.error('Resend unexpected error:', err);
    return json({ error: "L'e-mail n'a pas pu être envoyé. Réessayez dans quelques instants." }, 502);
  }
});

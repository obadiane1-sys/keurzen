/**
 * Keurzen — Edge Function: send-invite-code
 *
 * Génère un code d'invitation 6 chiffres, l'insère dans invitation_codes,
 * et envoie un email via Resend.
 *
 * Input (POST JSON, JWT requis) :
 *   { household_id: string, email: string, first_name?: string }
 *
 * Secrets requis :
 *   RESEND_API_KEY, RESEND_FROM_EMAIL
 *
 * Déploiement : npx supabase functions deploy send-invite-code --no-verify-jwt
 * L'auth est vérifiée manuellement via getUser() dans le handler.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CORS ────────────────────────────────────────────────────────────────────

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

// ─── Code generation ─────────────────────────────────────────────────────────

function generateCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, '0');
}

// ─── Email HTML ──────────────────────────────────────────────────────────────

function buildCodeEmailHtml(
  inviterName: string,
  householdName: string,
  code: string,
): string {
  const joinUrl = `https://app.keurzen.app/join-code?code=${code}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Code d'invitation Keurzen</title>
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
                Votre code d'invitation
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#64748B;line-height:1.6;">
                <strong style="color:#1E293B;">${inviterName}</strong> vous invite à rejoindre le foyer
                <strong style="color:#1E293B;">${householdName}</strong> sur Keurzen.
              </p>

              <!-- Code -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td align="center" style="background-color:#F7F9FC;border:2px solid #88D4A9;border-radius:16px;padding:20px 40px;">
                    <p style="margin:0;font-size:36px;font-weight:800;color:#212E44;letter-spacing:8px;font-family:monospace;">
                      ${code}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:15px;color:#64748B;text-align:center;">
                Saisissez ce code dans l'application ou cliquez sur le bouton ci-dessous.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td align="center" style="background-color:#88D4A9;border-radius:12px;">
                    <a href="${joinUrl}" target="_blank" style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                      Rejoindre le foyer &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#94A3B8;text-align:center;">
                Ce code est valide <strong>24 heures</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F7F9FC;padding:20px 40px;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center;">
                Si vous n'avez pas demandé cette invitation, ignorez simplement cet e-mail.
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

// ─── Handler ─────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // ── Env ───────────────────────────────────────────────────────────────────

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');

  if (!resendApiKey || !fromEmail) {
    console.error('Missing RESEND_API_KEY or RESEND_FROM_EMAIL');
    return json({ error: 'Configuration serveur incomplète' }, 500);
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  const authHeader = req.headers.get('Authorization') ?? req.headers.get('authorization');
  if (!authHeader) {
    return json({ error: 'Non authentifié' }, 401);
  }

  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return json({ error: 'Token invalide' }, 401);
  }

  // ── Body ──────────────────────────────────────────────────────────────────

  let body: { household_id?: string; email?: string; first_name?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps de requête invalide' }, 400);
  }

  const { household_id, email, first_name } = body;

  if (!household_id || !email) {
    return json({ error: 'household_id et email requis' }, 400);
  }

  // ── Vérifier que l'utilisateur est membre du foyer ────────────────────────

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: membership } = await adminClient
    .from('household_members')
    .select('id')
    .eq('household_id', household_id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return json({ error: 'Vous n\'êtes pas membre de ce foyer' }, 403);
  }

  // ── Récupérer le nom du foyer et de l'inviteur ────────────────────────────

  const { data: household } = await adminClient
    .from('households')
    .select('name')
    .eq('id', household_id)
    .single();

  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const householdName = household?.name ?? 'un foyer';
  const inviterName = profile?.full_name ?? 'Un membre de Keurzen';

  // ── Expire any existing active codes for this email + household ───────

  const { error: expireError } = await adminClient
    .from('invitation_codes')
    .update({ expires_at: new Date().toISOString() })
    .eq('email', email)
    .eq('household_id', household_id)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString());

  if (expireError) {
    console.error('Failed to expire old codes:', expireError.message);
    // Non-blocking — continue with new code generation
  }

  // ── Générer le code (avec retry sur collision) ────────────────────────────

  let code: string = '';
  let inserted = false;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateCode();
    const { error: insertError } = await adminClient
      .from('invitation_codes')
      .insert({
        code,
        household_id,
        created_by: user.id,
        expires_at: expiresAt,
        email,
        invited_name: first_name?.trim() || null,
      });

    if (!insertError) {
      inserted = true;
      break;
    }

    // Si erreur de contrainte unique, retry avec un autre code
    if (insertError.code === '23505') {
      continue;
    }

    console.error('Insert invitation_code error:', insertError);
    return json({ error: 'Impossible de générer le code' }, 500);
  }

  if (!inserted) {
    return json({ error: 'Impossible de générer un code unique' }, 500);
  }

  // ── Envoyer l'email via Resend ────────────────────────────────────────────

  try {
    const greeting = first_name ? `${first_name}, vous` : 'Vous';
    const subject = `${inviterName} vous invite à rejoindre son foyer sur Keurzen`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject,
        html: buildCodeEmailHtml(inviterName, householdName, code),
      }),
    });

    const resendBody = (await resendResponse.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendBody);
      // Le code est créé mais l'email a échoué — on le retourne quand même
      // pour que l'inviteur puisse le communiquer manuellement
      return json({
        success: true,
        code,
        expires_at: expiresAt,
        email_sent: false,
        email_error: resendBody.message ?? 'Erreur envoi email',
      });
    }

    console.log(`Invite code sent: ${code} → ${email} (resend_id: ${resendBody.id})`);

    return json({
      success: true,
      code,
      expires_at: expiresAt,
      email_sent: true,
    });
  } catch (err) {
    console.error('Resend unexpected error:', err);
    // Même fallback : retourner le code
    return json({
      success: true,
      code,
      expires_at: expiresAt,
      email_sent: false,
      email_error: 'Erreur réseau',
    });
  }
});

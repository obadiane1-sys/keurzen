/**
 * Keurzen — Edge Function: send-confirmation-email
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
 * serait reactive (ex: besoin d'emails via Resend au lieu du SMTP Supabase).
 * Ne pas supprimer sans verifier qu'aucun workflow externe ne l'appelle.
 *
 * ---
 *
 * Génère un code OTP à 6 chiffres et l'envoie via Resend.
 * Le code est stocké dans la table `email_verifications` avec une expiration 30 min.
 * L'utilisateur saisit le code dans l'app (écran verify-email) — pas de lien cliquable.
 *
 * Flow :
 *   1. Reçoit { email } dans le body (pas de JWT requis)
 *   2. Génère un code aléatoire à 6 chiffres
 *   3. Insère le code dans email_verifications (expire dans 30 min)
 *   4. Envoie l'email via Resend avec le code en gros (pas de lien)
 *   5. Retourne { success: true }
 *
 * Secrets requis :
 *   RESEND_API_KEY    — clé API Resend
 *   RESEND_FROM_EMAIL — ex: "Keurzen <noreply@keurzen.app>"
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

// ─── Génération OTP ───────────────────────────────────────────────────────────

function generateOtp(): string {
  // Entier aléatoire entre 100000 et 999999 (6 chiffres garantis)
  const num = crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000;
  return String(num);
}

// ─── Template email ───────────────────────────────────────────────────────────

function buildEmailHtml(code: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Code de vérification — Keurzen</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F9FC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F9FC;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(33,46,68,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#212E44;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Keurzen</p>
              <p style="margin:6px 0 0;font-size:13px;color:#88D4A9;letter-spacing:0.5px;">Gestion de foyer partagée</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1E293B;">
                Confirmez votre adresse email
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#64748B;line-height:1.6;">
                Entrez ce code dans l'application pour activer votre compte&nbsp;:
              </p>

              <!-- Code OTP -->
              <div style="background-color:#F7F9FC;border-radius:16px;padding:28px 20px;margin:0 0 32px;border:2px solid #E2E8F0;">
                <p style="margin:0;font-size:48px;font-weight:800;color:#212E44;letter-spacing:16px;font-variant-numeric:tabular-nums;">
                  ${code}
                </p>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#94A3B8;">
                Ce code est valable <strong>30 minutes</strong>.
              </p>
              <p style="margin:0;font-size:13px;color:#94A3B8;">
                Si vous n'avez pas créé de compte sur Keurzen, ignorez cet email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F7F9FC;padding:20px 40px;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center;">
                Keurzen — Gérez votre foyer sereinement, ensemble.
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

  // ── Body ──────────────────────────────────────────────────────────────────

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps de requête invalide' }, 400);
  }

  const { email } = body;
  if (!email) {
    return json({ error: 'email requis' }, 400);
  }

  // ── Rate limiting ─────────────────────────────────────────────────────────

  const normalizedEmail = email.toLowerCase().trim();
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Count non-expired codes for this email in the last 30 minutes
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { count: recentCount, error: countError } = await adminClient
    .from('email_verifications')
    .select('id', { count: 'exact', head: true })
    .eq('email', normalizedEmail)
    .gte('created_at', thirtyMinutesAgo)
    .gte('expires_at', new Date().toISOString());

  if (countError) {
    console.error('Rate limit check error:', countError.message);
    return json({ error: 'Erreur interne' }, 500);
  }

  if ((recentCount ?? 0) >= 3) {
    return json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }, 429);
  }

  // ── Génération et stockage du code OTP ────────────────────────────────────

  const code = generateOtp();

  const { error: insertError } = await adminClient
    .from('email_verifications')
    .insert({
      email: normalizedEmail,
      code,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });

  if (insertError) {
    console.error('Insert OTP error:', insertError.message);
    return json({ error: 'Impossible de générer le code de vérification' }, 500);
  }

  // ── Envoi via Resend ──────────────────────────────────────────────────────

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: `${code} — Votre code de vérification Keurzen`,
        html: buildEmailHtml(code),
      }),
    });

    const resendBody = await resendResponse.json().catch(() => ({})) as { id?: string; name?: string; message?: string };

    if (!resendResponse.ok) {
      const reason = resendBody.message ?? resendBody.name ?? `HTTP ${resendResponse.status}`;
      console.error('Resend API error:', reason, resendBody);
      return json({ error: "L'e-mail n'a pas pu être envoyé. Réessayez dans quelques instants." }, 502);
    }

    console.log(`OTP email sent to ${email} (resend_id: ${resendBody.id})`);
    return json({ success: true, resend_id: resendBody.id });
  } catch (err) {
    console.error('Resend unexpected error:', err);
    return json({ error: "L'e-mail n'a pas pu être envoyé. Réessayez dans quelques instants." }, 502);
  }
});

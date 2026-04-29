/**
 * Keurzen — Edge Function: delete-account
 *
 * Suppression definitive du compte utilisateur (RGPD / App Store).
 *
 * Securite :
 *   - JWT obligatoire. Le user est identifie via getUser() (jamais via body).
 *   - service_role utilise uniquement cote Edge.
 *
 * Logique :
 *   1. Identifie le user via JWT.
 *   2. Pour chaque foyer ou il est owner :
 *      - s'il y a d'autres membres : refuser (409 has_co_members).
 *      - s'il est solo : supprimer le foyer (cascade tout le contenu).
 *   3. Supprime le user via auth.admin.deleteUser (cascade vers profiles
 *      et tout ce qui est CASCADE sur user_id).
 *   4. Envoie un email de confirmation (Resend, fire-and-forget).
 *
 * Deploiement : npx supabase functions deploy delete-account
 *
 * Secrets requis (deja presents dans le projet) :
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
 *   RESEND_API_KEY, RESEND_FROM_EMAIL
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

// ─── Email template ───────────────────────────────────────────────────────────

function buildDeletionEmailHtml(displayName: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Compte supprime — Keurzen</title>
</head>
<body style="margin:0;padding:0;background-color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F0FF;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 16px rgba(150,123,182,0.12);">
          <tr>
            <td style="background-color:#967BB6;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Keurzen</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;color:#5F5475;">
              <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:600;">Votre compte a ete supprime</h1>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;">
                Bonjour ${displayName},
              </p>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;">
                Nous confirmons que votre compte Keurzen a bien ete supprime,
                conformement a votre demande.
              </p>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;">
                Vos donnees personnelles ont ete effacees de nos systemes.
                Si vous etiez seul·e dans votre foyer, le foyer et son contenu
                ont egalement ete supprimes.
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;">
                Si vous n'etes pas a l'origine de cette demande, contactez-nous
                immediatement.
              </p>
              <p style="margin:0;font-size:13px;color:#7A7190;line-height:1.5;">
                A bientot peut-etre,<br />
                L'equipe Keurzen
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

async function sendDeletionEmail(email: string, displayName: string): Promise<void> {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const resendFrom = Deno.env.get('RESEND_FROM_EMAIL');
  if (!resendKey || !resendFrom) {
    console.warn('delete-account: RESEND_* missing, skipping confirmation email');
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFrom,
        to: email,
        subject: 'Votre compte Keurzen a ete supprime',
        html: buildDeletionEmailHtml(displayName),
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('delete-account: Resend send failed', res.status, text);
    }
  } catch (err) {
    console.error('delete-account: Resend exception', err);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    return await handleRequest(req);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('delete-account unhandled error:', msg);
    return json({ error: msg }, 500);
  }
});

async function handleRequest(req: Request): Promise<Response> {
  const supabaseUrl    = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey        = Deno.env.get('SUPABASE_ANON_KEY')!;

  // ── Authentification du caller ────────────────────────────────────────────

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Non authentifie' }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
  if (authError || !caller) return json({ error: 'Token invalide' }, 401);

  const userId = caller.id;
  const userEmail = caller.email ?? '';

  // ── Client admin (service_role) ───────────────────────────────────────────

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // ── Recuperer le profil pour l'email de confirmation ──────────────────────

  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .maybeSingle();

  const emailForNotice = (profile?.email as string | undefined) ?? userEmail;
  const displayName    = (profile?.full_name as string | undefined)?.trim() || 'Utilisateur';

  // ── Lister les foyers du user ─────────────────────────────────────────────

  const { data: memberships, error: memErr } = await adminClient
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', userId);

  if (memErr) {
    console.error('delete-account: failed to read memberships', memErr);
    return json({ error: 'Erreur de lecture du foyer' }, 500);
  }

  const ownedHouseholdIds = (memberships ?? [])
    .filter((m) => m.role === 'owner')
    .map((m) => m.household_id as string);

  // ── Pour chaque foyer owner : verifier la solitude ────────────────────────

  const householdsToDelete: string[] = [];

  for (const householdId of ownedHouseholdIds) {
    const { count, error: cntErr } = await adminClient
      .from('household_members')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId)
      .neq('user_id', userId);

    if (cntErr) {
      console.error('delete-account: failed to count co-members', cntErr);
      return json({ error: 'Erreur de verification du foyer' }, 500);
    }

    if ((count ?? 0) > 0) {
      // Owner avec d'autres membres → refuser
      return json({
        error: 'has_co_members',
        message: 'Transferez la propriete ou retirez les autres membres du foyer avant de supprimer votre compte.',
      }, 409);
    }

    householdsToDelete.push(householdId);
  }

  // ── Supprimer les foyers solo (cascade tout le contenu) ───────────────────

  for (const householdId of householdsToDelete) {
    const { error: delErr } = await adminClient
      .from('households')
      .delete()
      .eq('id', householdId);

    if (delErr) {
      console.error('delete-account: failed to delete household', householdId, delErr);
      return json({ error: 'Echec de la suppression du foyer' }, 500);
    }
  }

  // ── Supprimer le user (cascade auth.users → profiles + tout le reste) ─────

  const { error: delUserErr } = await adminClient.auth.admin.deleteUser(userId);
  if (delUserErr) {
    console.error('delete-account: failed to delete auth user', delUserErr);
    return json({ error: 'Echec de la suppression du compte' }, 500);
  }

  // ── Email de confirmation (fire-and-forget) ───────────────────────────────

  if (emailForNotice) {
    // Pas d'await bloquant — l'echec d'email ne doit pas faire echouer la suppression
    sendDeletionEmail(emailForNotice, displayName).catch((e) =>
      console.error('delete-account: email send rejected', e),
    );
  }

  return json({
    success: true,
    deleted_households: householdsToDelete.length,
  });
}

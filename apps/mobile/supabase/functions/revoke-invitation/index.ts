/**
 * Keurzen — Edge Function: revoke-invitation
 *
 * Supprime la ligne dans la table invitations.
 *
 * Pourquoi une edge function :
 *   La vérification d'appartenance au foyer requiert la service role key,
 *   non disponible côté client.
 *
 * Sécurité :
 *   JWT obligatoire (--no-verify-jwt NOT set). L'appelant doit être
 *   membre du foyer auquel appartient l'invitation.
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
    console.error('revoke-invitation unhandled error:', msg);
    return json({ error: msg }, 500);
  }
});

async function handleRequest(req: Request): Promise<Response> {
  const supabaseUrl    = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey        = Deno.env.get('SUPABASE_ANON_KEY')!;

  // ── Body ──────────────────────────────────────────────────────────────────

  let body: { invitation_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps de requête invalide' }, 400);
  }

  const { invitation_id } = body;
  if (!invitation_id) return json({ error: 'invitation_id requis' }, 400);

  // ── Authentification du caller ────────────────────────────────────────────

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Non authentifié' }, 401);

  // Valider le JWT via le client anon (RLS actif)
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
  if (authError || !caller) return json({ error: 'Token invalide' }, 401);

  // Client admin pour les opérations privilégiées (service role)
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // ── Récupérer l'invitation ─────────────────────────────────────────────────

  const { data: invitation, error: invError } = await adminClient
    .from('invitations')
    .select('id, household_id, email, status')
    .eq('id', invitation_id)
    .single();

  if (invError || !invitation) return json({ error: 'Invitation introuvable' }, 404);

  // Idempotent : déjà révoquée → succès sans rien faire
  if (invitation.status === 'revoked') return json({ success: true });

  // ── Vérifier que le caller est membre du foyer ────────────────────────────

  const { data: membership } = await adminClient
    .from('household_members')
    .select('id')
    .eq('household_id', invitation.household_id)
    .eq('user_id', caller.id)
    .maybeSingle();

  if (!membership) return json({ error: 'Non autorisé' }, 403);

  // ── Supprimer l'invitation ────────────────────────────────────────────────

  const { error: deleteError } = await adminClient
    .from('invitations')
    .delete()
    .eq('id', invitation_id);

  if (deleteError) {
    console.error('revoke-invitation: delete error:', deleteError.message);
    return json({ error: "Erreur lors de l'annulation" }, 500);
  }

  return json({ success: true });
}

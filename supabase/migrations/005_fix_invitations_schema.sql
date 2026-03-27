-- ============================================================
-- Keurzen — Fix invitations schema + RPCs + RLS policies
--
-- Contexte :
--   Les migrations 003 et 004 ont été écrites dans le repo
--   mais n'ont pas été appliquées sur la base Supabase.
--   Cette migration consolide leurs changements de manière
--   idempotente (ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE,
--   DROP POLICY IF EXISTS).
--
-- Changements :
--   1. Colonne channel sur invitations (correctif principal)
--   2. Policy SELECT creator sur households
--   3. RPC get_household_by_invite_code
--   4. RPC join_household_by_token
-- ============================================================

-- ─── 1. Colonne channel ───────────────────────────────────────────────────────
-- Manquante : c'est la cause de l'erreur "column 'channel' not found in schema cache"
-- DEFAULT 'link' : les lignes existantes reçoivent cette valeur automatiquement.

ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'link'
  CHECK (channel IN ('link', 'email', 'contacts', 'code'));

-- ─── 2. Policy SELECT : le créateur peut lire son foyer après INSERT ──────────
-- Sans cette policy, INSERT { name, created_by } + .select() échoue
-- car la policy SELECT existante exige d'être dans household_members.

DROP POLICY IF EXISTS "Creator can view their own household" ON public.households;
CREATE POLICY "Creator can view their own household"
  ON public.households FOR SELECT
  USING (created_by = auth.uid());

-- ─── 3. RPC : lookup household par invite_code ────────────────────────────────
-- Utilisée par useJoinHousehold côté client.
-- SECURITY DEFINER car le SELECT direct sur households est bloqué par RLS
-- pour un utilisateur qui n'est pas encore membre.

CREATE OR REPLACE FUNCTION public.get_household_by_invite_code(p_code TEXT)
RETURNS TABLE (
  id          UUID,
  name        TEXT,
  invite_code TEXT,
  created_by  UUID,
  created_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, invite_code, created_by, created_at, updated_at
  FROM public.households
  WHERE invite_code = upper(trim(p_code))
  LIMIT 1;
$$;

-- ─── 4. RPC : rejoindre un foyer via token d'invitation ──────────────────────
-- Utilisée par useJoinByToken côté client.
-- SECURITY DEFINER : valide l'invitation, insère le membre, marque l'invitation
-- comme acceptée — le tout de façon atomique, sans que le client n'ait à lire
-- l'invitation directement (bloqué par RLS tant que non membre).
-- Utilise auth.uid() — aucun user_id client n'est accepté (sécurité).

CREATE OR REPLACE FUNCTION public.join_household_by_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation  invitations%ROWTYPE;
  v_household   households%ROWTYPE;
  v_member_count INTEGER;
  v_color       TEXT;
  v_colors      TEXT[] := ARRAY[
    '#FFA69E', '#88D4A9', '#AFCBFF', '#BCA7FF',
    '#FCD34D', '#6EE7B7', '#F9A8D4', '#93C5FD'
  ];
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'Non authentifié');
  END IF;

  SELECT * INTO v_invitation FROM public.invitations WHERE token = p_token LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Lien invalide ou introuvable');
  END IF;

  IF v_invitation.status = 'accepted' THEN
    RETURN jsonb_build_object('error', 'Ce lien a déjà été utilisé');
  END IF;

  IF v_invitation.status = 'revoked' THEN
    RETURN jsonb_build_object('error', 'Ce lien a été révoqué');
  END IF;

  IF v_invitation.expires_at < NOW() THEN
    UPDATE public.invitations SET status = 'expired' WHERE id = v_invitation.id;
    RETURN jsonb_build_object('error', 'Ce lien a expiré');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = v_invitation.household_id AND user_id = v_uid
  ) THEN
    SELECT * INTO v_household FROM public.households WHERE id = v_invitation.household_id;
    RETURN jsonb_build_object('household', row_to_json(v_household), 'already_member', TRUE);
  END IF;

  SELECT COUNT(*) INTO v_member_count
    FROM public.household_members WHERE household_id = v_invitation.household_id;
  v_color := v_colors[((v_member_count) % array_length(v_colors, 1)) + 1];

  INSERT INTO public.household_members (household_id, user_id, role, color)
  VALUES (v_invitation.household_id, v_uid, 'member', v_color);

  UPDATE public.invitations SET status = 'accepted' WHERE id = v_invitation.id;

  SELECT * INTO v_household FROM public.households WHERE id = v_invitation.household_id;

  RETURN jsonb_build_object('household', row_to_json(v_household), 'already_member', FALSE);
END;
$$;

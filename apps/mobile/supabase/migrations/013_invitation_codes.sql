-- ============================================================
-- Keurzen — Invitation codes (6-digit OTP, 15 min expiry)
--
-- Remplace le flow magic link par un code numérique temporaire.
-- Le code est généré côté Edge Function, inséré ici,
-- puis validé par la RPC redeem_invitation_code.
-- ============================================================

-- ─── Table ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invitation_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL,
  household_id  UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  created_by    UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,
  used          BOOLEAN NOT NULL DEFAULT false,
  used_by       UUID REFERENCES auth.users(id),
  used_at       TIMESTAMPTZ,
  UNIQUE(code)
);

-- Index pour lookup rapide sur codes actifs
CREATE INDEX IF NOT EXISTS idx_invitation_codes_active
  ON public.invitation_codes (code)
  WHERE used = false;

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- Membres du foyer peuvent insérer des codes
CREATE POLICY "members_can_create_codes" ON public.invitation_codes
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = invitation_codes.household_id
        AND hm.user_id = auth.uid()
    )
  );

-- Membres du foyer peuvent voir les codes de leur foyer
CREATE POLICY "members_can_view_codes" ON public.invitation_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = invitation_codes.household_id
        AND hm.user_id = auth.uid()
    )
  );

-- ─── RPC : Validation et utilisation du code ────────────────────────────────
-- Appelée par l'invité (authentifié) pour rejoindre un foyer.
-- SECURITY DEFINER car l'invité n'est pas encore membre → RLS bloquerait.

CREATE OR REPLACE FUNCTION public.redeem_invitation_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code        invitation_codes%ROWTYPE;
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

  -- Recherche du code (trim + exact match)
  SELECT * INTO v_code
    FROM public.invitation_codes
    WHERE code = trim(p_code)
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Code invalide');
  END IF;

  IF v_code.used THEN
    RETURN jsonb_build_object('error', 'Ce code a déjà été utilisé');
  END IF;

  IF v_code.expires_at < NOW() THEN
    RETURN jsonb_build_object('error', 'Ce code a expiré');
  END IF;

  -- Vérifier si déjà membre
  IF EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = v_code.household_id AND user_id = v_uid
  ) THEN
    SELECT * INTO v_household FROM public.households WHERE id = v_code.household_id;
    RETURN jsonb_build_object('household', row_to_json(v_household), 'already_member', TRUE);
  END IF;

  -- Attribuer une couleur
  SELECT COUNT(*) INTO v_member_count
    FROM public.household_members WHERE household_id = v_code.household_id;
  v_color := v_colors[((v_member_count) % array_length(v_colors, 1)) + 1];

  -- Insérer le membre
  INSERT INTO public.household_members (household_id, user_id, role, color)
  VALUES (v_code.household_id, v_uid, 'member', v_color);

  -- Marquer le code comme utilisé
  UPDATE public.invitation_codes
    SET used = true, used_by = v_uid, used_at = now()
    WHERE id = v_code.id;

  -- Retourner le foyer
  SELECT * INTO v_household FROM public.households WHERE id = v_code.household_id;

  RETURN jsonb_build_object('household', row_to_json(v_household), 'already_member', FALSE);
END;
$$;

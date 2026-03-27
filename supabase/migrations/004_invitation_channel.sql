-- ============================================================
-- Keurzen — Invitation channel + join by token RPC
-- ============================================================

-- ─── Ajout du champ channel sur invitations ───────────────────────────────────

ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'link'
  CHECK (channel IN ('link', 'email', 'contacts', 'code'));

-- ─── RPC : rejoindre un foyer via token d'invitation ─────────────────────────
-- SECURITY DEFINER : contourne RLS pour lire l'invitation et écrire le membre.
-- Utilise auth.uid() pour identifier l'utilisateur — aucun paramètre user_id
-- n'est accepté du client pour éviter toute usurpation.

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
  -- Vérification auth
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'Non authentifié');
  END IF;

  -- Récupération de l'invitation
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

  -- Vérifie si déjà membre
  IF EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = v_invitation.household_id AND user_id = v_uid
  ) THEN
    -- Déjà membre : retourner le foyer sans erreur bloquante
    SELECT * INTO v_household FROM public.households WHERE id = v_invitation.household_id;
    RETURN jsonb_build_object('household', row_to_json(v_household), 'already_member', TRUE);
  END IF;

  -- Sélection de la couleur membre
  SELECT COUNT(*) INTO v_member_count
    FROM public.household_members WHERE household_id = v_invitation.household_id;
  v_color := v_colors[((v_member_count) % array_length(v_colors, 1)) + 1];

  -- Insertion du membre
  INSERT INTO public.household_members (household_id, user_id, role, color)
  VALUES (v_invitation.household_id, v_uid, 'member', v_color);

  -- Marque l'invitation comme acceptée
  UPDATE public.invitations SET status = 'accepted' WHERE id = v_invitation.id;

  -- Retourne le foyer
  SELECT * INTO v_household FROM public.households WHERE id = v_invitation.household_id;

  RETURN jsonb_build_object('household', row_to_json(v_household), 'already_member', FALSE);
END;
$$;

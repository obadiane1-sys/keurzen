-- ─── Migration 006: get_invite_preview ───────────────────────────────────────
--
-- RPC publique (sans authentification) permettant d'afficher les métadonnées
-- d'une invitation avant que l'utilisateur soit connecté.
-- Utilisée par la page web /join/[token] pour afficher le nom du foyer et
-- le prénom de l'inviteur.
--
-- Sécurité : ne retourne que des informations non-sensibles, jamais les emails
-- ni les IDs internes.
--
-- Idempotent : CREATE OR REPLACE.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_invite_preview(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
BEGIN
  SELECT
    i.expires_at,
    i.status,
    h.name   AS household_name,
    p.full_name AS inviter_name
  INTO v_row
  FROM invitations i
  JOIN households  h ON h.id = i.household_id
  LEFT JOIN profiles p ON p.id = i.invited_by
  WHERE i.token = p_token;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Invitation introuvable');
  END IF;

  IF v_row.status != 'pending' THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Invitation déjà utilisée ou annulée'
    );
  END IF;

  IF v_row.expires_at < now() THEN
    RETURN json_build_object('valid', false, 'error', 'Invitation expirée');
  END IF;

  RETURN json_build_object(
    'valid',          true,
    'household_name', v_row.household_name,
    'inviter_name',   v_row.inviter_name
  );
END;
$$;

-- Permettre l'appel sans être authentifié (rôle anon)
GRANT EXECUTE ON FUNCTION get_invite_preview(text) TO anon;
GRANT EXECUTE ON FUNCTION get_invite_preview(text) TO authenticated;

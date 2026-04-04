-- Fix: do not mark invitation code as used when user is already a member.

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
    RETURN jsonb_build_object('error', 'Non authentifie');
  END IF;

  SELECT * INTO v_code
    FROM public.invitation_codes
    WHERE code = trim(p_code)
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Code invalide');
  END IF;

  IF v_code.used THEN
    RETURN jsonb_build_object('error', 'Ce code a deja ete utilise');
  END IF;

  IF v_code.expires_at < NOW() THEN
    RETURN jsonb_build_object('error', 'Ce code a expire');
  END IF;

  -- Already member — do NOT mark code as used
  IF EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = v_code.household_id AND user_id = v_uid
  ) THEN
    SELECT * INTO v_household FROM public.households WHERE id = v_code.household_id;
    RETURN jsonb_build_object('household', row_to_json(v_household), 'already_member', TRUE);
  END IF;

  -- Assign color
  SELECT COUNT(*) INTO v_member_count
    FROM public.household_members WHERE household_id = v_code.household_id;
  v_color := v_colors[((v_member_count) % array_length(v_colors, 1)) + 1];

  -- Insert member
  INSERT INTO public.household_members (household_id, user_id, role, color)
  VALUES (v_code.household_id, v_uid, 'member', v_color);

  -- Mark code as used (only when actually joining)
  UPDATE public.invitation_codes
    SET used = true, used_by = v_uid, used_at = now()
    WHERE id = v_code.id;

  SELECT * INTO v_household FROM public.households WHERE id = v_code.household_id;

  RETURN jsonb_build_object('household', row_to_json(v_household), 'already_member', FALSE);
END;
$$;

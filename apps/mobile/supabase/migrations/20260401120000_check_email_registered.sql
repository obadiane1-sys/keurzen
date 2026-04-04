-- Migration 017 — RPC check_email_registered
-- Permet de verifier si un email correspond a un profil complet (full_name renseigne).
-- Utilisee par le login pour distinguer les vrais comptes des ghost users
-- crees par signInWithOtp (qui n'ont pas de full_name).
--
-- Appelee depuis : src/lib/supabase/auth.ts (sendOtpForLogin)

CREATE OR REPLACE FUNCTION public.check_email_registered(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE email = lower(trim(p_email))
      AND full_name IS NOT NULL
  );
END;
$$;

-- Accessible par les utilisateurs anonymes (pre-login) et authentifies
GRANT EXECUTE ON FUNCTION public.check_email_registered(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_registered(TEXT) TO authenticated;

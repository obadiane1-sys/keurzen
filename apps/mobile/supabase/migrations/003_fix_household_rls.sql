-- ============================================================
-- Keurzen — Fix household RLS policies
--
-- Problème 1 (CREATE) :
--   INSERT { name, created_by } suivi de .select() échoue car la
--   policy SELECT existante exige d'être dans household_members.
--   Or le créateur n'y est pas encore au moment du SELECT post-INSERT.
--
-- Fix : ajouter une policy SELECT qui autorise le créateur à lire
--   son propre foyer via created_by = auth.uid().
--
-- Problème 2 (JOIN, signalé en note) :
--   Le SELECT par invite_code échoue aussi pour la même raison.
--   Fix côté client (voir household.ts) : utiliser une RPC function
--   avec SECURITY DEFINER ou restructurer le flow. Traité séparément.
-- ============================================================

-- Policy : le créateur peut lire son foyer immédiatement après l'INSERT,
-- avant d'être ajouté dans household_members.
DROP POLICY IF EXISTS "Creator can view their own household" ON public.households;
CREATE POLICY "Creator can view their own household"
  ON public.households FOR SELECT
  USING (created_by = auth.uid());

-- ─── RPC : lookup household by invite_code ────────────────────────────────────
-- Utilisée par useJoinHousehold pour contourner la policy SELECT qui exige
-- d'être membre. Tourne en SECURITY DEFINER → accès direct sans RLS.
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

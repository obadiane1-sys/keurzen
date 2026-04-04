-- ============================================================
-- Keurzen — Shared Lists (shopping, todo, custom)
--
-- Listes partagées au sein d'un foyer avec items cochables,
-- catégories, assignation et tri par position.
-- ============================================================

-- ─── Table : shared_lists ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shared_lists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('shopping', 'todo', 'custom')),
  icon          TEXT,
  color         TEXT,
  archived      BOOLEAN NOT NULL DEFAULT false,
  created_by    UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_lists_household
  ON public.shared_lists (household_id) WHERE archived = false;

-- ─── Table : shared_list_items ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shared_list_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id       UUID NOT NULL REFERENCES public.shared_lists(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  checked       BOOLEAN NOT NULL DEFAULT false,
  checked_by    UUID REFERENCES auth.users(id),
  checked_at    TIMESTAMPTZ,
  quantity      TEXT,
  category      TEXT,
  assigned_to   UUID REFERENCES auth.users(id),
  position      INTEGER NOT NULL DEFAULT 0,
  created_by    UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_list_items_list
  ON public.shared_list_items (list_id, checked, position);

-- ─── RLS : shared_lists ─────────────────────────────────────────────────────

ALTER TABLE public.shared_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_can_view_lists" ON public.shared_lists;
CREATE POLICY "members_can_view_lists" ON public.shared_lists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = shared_lists.household_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_can_create_lists" ON public.shared_lists;
CREATE POLICY "members_can_create_lists" ON public.shared_lists
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = shared_lists.household_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_can_update_lists" ON public.shared_lists;
CREATE POLICY "members_can_update_lists" ON public.shared_lists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = shared_lists.household_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_can_delete_lists" ON public.shared_lists;
CREATE POLICY "members_can_delete_lists" ON public.shared_lists
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = shared_lists.household_id
        AND hm.user_id = auth.uid()
    )
  );

-- ─── RLS : shared_list_items ────────────────────────────────────────────────

ALTER TABLE public.shared_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_can_view_list_items" ON public.shared_list_items;
CREATE POLICY "members_can_view_list_items" ON public.shared_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shared_lists sl
      JOIN public.household_members hm ON hm.household_id = sl.household_id
      WHERE sl.id = shared_list_items.list_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_can_create_list_items" ON public.shared_list_items;
CREATE POLICY "members_can_create_list_items" ON public.shared_list_items
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.shared_lists sl
      JOIN public.household_members hm ON hm.household_id = sl.household_id
      WHERE sl.id = shared_list_items.list_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_can_update_list_items" ON public.shared_list_items;
CREATE POLICY "members_can_update_list_items" ON public.shared_list_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.shared_lists sl
      JOIN public.household_members hm ON hm.household_id = sl.household_id
      WHERE sl.id = shared_list_items.list_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_can_delete_list_items" ON public.shared_list_items;
CREATE POLICY "members_can_delete_list_items" ON public.shared_list_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.shared_lists sl
      JOIN public.household_members hm ON hm.household_id = sl.household_id
      WHERE sl.id = shared_list_items.list_id
        AND hm.user_id = auth.uid()
    )
  );

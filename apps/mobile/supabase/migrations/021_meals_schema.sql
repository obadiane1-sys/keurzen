-- ============================================================
-- Keurzen — Meal Planning Module
--
-- Tables: ingredients, recipes, recipe_ingredients,
--         meal_plan_items, recipe_favorites
-- ============================================================

-- ─── Table : ingredients ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ingredients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  category      TEXT NOT NULL CHECK (category IN (
    'fruits_legumes', 'viandes_poissons', 'produits_laitiers',
    'boulangerie', 'epicerie', 'surgeles', 'boissons',
    'hygiene', 'entretien', 'autre'
  )),
  default_unit  TEXT NOT NULL DEFAULT 'piece',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingredients_name
  ON public.ingredients USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_ingredients_category
  ON public.ingredients (category);

-- ─── Table : recipes ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recipes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID REFERENCES public.households(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT,
  prep_time     INTEGER NOT NULL DEFAULT 0,
  cook_time     INTEGER NOT NULL DEFAULT 0,
  servings      INTEGER NOT NULL DEFAULT 4,
  difficulty    TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags          TEXT[] NOT NULL DEFAULT '{}',
  steps         JSONB NOT NULL DEFAULT '[]',
  source        TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('system', 'user')),
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipes_household
  ON public.recipes (household_id);

CREATE INDEX IF NOT EXISTS idx_recipes_source
  ON public.recipes (source);

CREATE INDEX IF NOT EXISTS idx_recipes_tags
  ON public.recipes USING gin (tags);

-- ─── Table : recipe_ingredients ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id       UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient_id   UUID NOT NULL REFERENCES public.ingredients(id),
  quantity        NUMERIC NOT NULL DEFAULT 1,
  unit            TEXT NOT NULL DEFAULT 'piece',
  optional        BOOLEAN NOT NULL DEFAULT false,
  note            TEXT
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe
  ON public.recipe_ingredients (recipe_id);

-- ─── Table : meal_plan_items ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.meal_plan_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  recipe_id       UUID NOT NULL REFERENCES public.recipes(id),
  date            DATE NOT NULL,
  meal_type       TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  servings        INTEGER NOT NULL DEFAULT 4,
  assigned_to     UUID REFERENCES auth.users(id),
  task_id         UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_plan_items_household_date
  ON public.meal_plan_items (household_id, date);

-- ─── Table : recipe_favorites ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.recipe_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id   UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_favorites_user
  ON public.recipe_favorites (user_id);

-- ─── Enable pg_trgm for ingredient fuzzy search ────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── RLS : ingredients ──────────────────────────────────────────────────────

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_read_ingredients" ON public.ingredients;
CREATE POLICY "anyone_can_read_ingredients" ON public.ingredients
  FOR SELECT USING (true);

-- No insert/update/delete policies — seed only

-- ─── RLS : recipes ──────────────────────────────────────────────────────────

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_read_system_recipes" ON public.recipes;
CREATE POLICY "anyone_can_read_system_recipes" ON public.recipes
  FOR SELECT USING (source = 'system');

DROP POLICY IF EXISTS "members_can_read_household_recipes" ON public.recipes;
CREATE POLICY "members_can_read_household_recipes" ON public.recipes
  FOR SELECT USING (
    household_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = recipes.household_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_can_create_recipes" ON public.recipes;
CREATE POLICY "members_can_create_recipes" ON public.recipes
  FOR INSERT WITH CHECK (
    household_id IS NOT NULL
    AND source = 'user'
    AND EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = recipes.household_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_can_update_recipes" ON public.recipes;
CREATE POLICY "members_can_update_recipes" ON public.recipes
  FOR UPDATE USING (
    household_id IS NOT NULL
    AND source = 'user'
    AND EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = recipes.household_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_can_delete_recipes" ON public.recipes;
CREATE POLICY "members_can_delete_recipes" ON public.recipes
  FOR DELETE USING (
    household_id IS NOT NULL
    AND source = 'user'
    AND EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = recipes.household_id
        AND hm.user_id = auth.uid()
    )
  );

-- ─── RLS : recipe_ingredients ───────────────────────────────────────────────

ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_read_recipe_ingredients" ON public.recipe_ingredients;
CREATE POLICY "anyone_can_read_recipe_ingredients" ON public.recipe_ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_ingredients.recipe_id
        AND (
          r.source = 'system'
          OR EXISTS (
            SELECT 1 FROM public.household_members hm
            WHERE hm.household_id = r.household_id
              AND hm.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "members_can_manage_recipe_ingredients" ON public.recipe_ingredients;
CREATE POLICY "members_can_manage_recipe_ingredients" ON public.recipe_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_ingredients.recipe_id
        AND r.source = 'user'
        AND EXISTS (
          SELECT 1 FROM public.household_members hm
          WHERE hm.household_id = r.household_id
            AND hm.user_id = auth.uid()
        )
    )
  );

-- ─── RLS : meal_plan_items ──────────────────────────────────────────────────

ALTER TABLE public.meal_plan_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_can_view_meal_plan" ON public.meal_plan_items;
CREATE POLICY "members_can_view_meal_plan" ON public.meal_plan_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = meal_plan_items.household_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_can_create_meal_plan" ON public.meal_plan_items;
CREATE POLICY "members_can_create_meal_plan" ON public.meal_plan_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = meal_plan_items.household_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_can_update_meal_plan" ON public.meal_plan_items;
CREATE POLICY "members_can_update_meal_plan" ON public.meal_plan_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = meal_plan_items.household_id
        AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "members_can_delete_meal_plan" ON public.meal_plan_items;
CREATE POLICY "members_can_delete_meal_plan" ON public.meal_plan_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = meal_plan_items.household_id
        AND hm.user_id = auth.uid()
    )
  );

-- ─── RLS : recipe_favorites ────────────────────────────────────────────────

ALTER TABLE public.recipe_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_manage_own_favorites" ON public.recipe_favorites;
CREATE POLICY "users_can_manage_own_favorites" ON public.recipe_favorites
  FOR ALL USING (user_id = auth.uid());

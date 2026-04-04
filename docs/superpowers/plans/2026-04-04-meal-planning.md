# Meal Planning + Smart Grocery List — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete meal planning module to Keurzen: recipe catalog (system dataset + household recipes), flexible weekly planner with cook assignment, and automatic grocery list generation with ingredient merging — integrated with the existing TLX/balance system.

**Architecture:** New Supabase tables (`ingredients`, `recipes`, `recipe_ingredients`, `meal_plan_items`, `recipe_favorites`) with RLS. TanStack Query hooks in two files (`recipes.ts`, `meals.ts`). 7 screens under `app/(app)/meals/` accessible from the Menu. Meal planning creates `Task` records (category `cooking`) that flow through the existing TLX completion system. Grocery list generation creates/updates `SharedList` records via the existing lists module.

**Tech Stack:** Expo Router 4, React Native, TypeScript strict, Supabase (Postgres + RLS), TanStack Query v5, Zustand, react-hook-form + zod

**Spec:** `docs/superpowers/specs/2026-04-04-meal-planning-design.md`

---

## File Structure

### New files to create

| File | Responsibility |
|---|---|
| `supabase/migrations/021_meals_schema.sql` | Tables, indexes, RLS for meals module |
| `supabase/migrations/022_meals_seed.sql` | Seed ~300 recipes + ~200 ingredients |
| `src/types/index.ts` | Add meal-related types (modify existing) |
| `src/lib/queries/recipes.ts` | TanStack hooks for recipes CRUD, favorites, ingredient search |
| `src/lib/queries/meals.ts` | TanStack hooks for meal plan CRUD, grocery list generation |
| `src/components/meals/MealCard.tsx` | Card for a meal in the weekly planner |
| `src/components/meals/MealPlanDay.tsx` | Day section with its meals + empty placeholder |
| `src/components/meals/RecipeCard.tsx` | Card for a recipe in the catalog grid |
| `src/components/meals/RecipeFilters.tsx` | Horizontal scrollable filter chips |
| `src/components/meals/IngredientRow.tsx` | Ingredient line in recipe detail |
| `src/components/meals/StepRow.tsx` | Numbered step in recipe detail |
| `app/(app)/meals/_layout.tsx` | Stack layout for meals module |
| `app/(app)/meals/index.tsx` | Weekly planner screen (main) |
| `app/(app)/meals/recipes/index.tsx` | Recipe catalog screen |
| `app/(app)/meals/recipes/[id].tsx` | Recipe detail screen |
| `app/(app)/meals/recipes/create.tsx` | Create household recipe form |
| `app/(app)/meals/add.tsx` | Bottom sheet: add meal to planner |
| `app/(app)/meals/history.tsx` | Meal history screen |
| `app/(app)/meals/favorites.tsx` | Favorite recipes screen |

### Existing files to modify

| File | Change |
|---|---|
| `src/types/index.ts` | Add `Ingredient`, `Recipe`, `RecipeIngredient`, `MealPlanItem`, `RecipeFavorite`, `MealType`, `RecipeDifficulty`, `RecipeSource` types |
| `app/(app)/menu/index.tsx` | Add "Repas" MenuRow in the Foyer section |

---

## Task 1: Database Migration — Tables & RLS

**Files:**
- Create: `supabase/migrations/021_meals_schema.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
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
```

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db push`
Expected: Migration applied successfully, 5 new tables created.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/021_meals_schema.sql
git commit -m "feat(db): add meals module schema — ingredients, recipes, meal_plan_items, favorites with RLS"
```

---

## Task 2: Seed Data — Ingredients & Recipes

**Files:**
- Create: `supabase/migrations/022_meals_seed.sql`

This is a large migration file. The seed contains ~200 normalized ingredients and ~50 starter recipes (a representative subset — the full 300 will be expanded in a follow-up). Each recipe has its `recipe_ingredients` rows.

- [ ] **Step 1: Write the seed migration**

The file must follow this structure (showing a representative subset — the implementer should expand to ~200 ingredients and ~50 recipes minimum):

```sql
-- ============================================================
-- Keurzen — Meal Planning Seed Data
--
-- ~200 normalized ingredients + ~50 starter recipes
-- All system recipes: source = 'system', household_id = NULL
-- Idempotent: ON CONFLICT DO NOTHING
-- ============================================================

-- ─── Ingredients ────────────────────────────────────────────────────────────

INSERT INTO public.ingredients (id, name, category, default_unit) VALUES
  -- Fruits & Légumes
  (gen_random_uuid(), 'tomate', 'fruits_legumes', 'piece'),
  (gen_random_uuid(), 'oignon', 'fruits_legumes', 'piece'),
  (gen_random_uuid(), 'ail', 'fruits_legumes', 'gousse'),
  (gen_random_uuid(), 'carotte', 'fruits_legumes', 'piece'),
  (gen_random_uuid(), 'pomme de terre', 'fruits_legumes', 'piece'),
  (gen_random_uuid(), 'courgette', 'fruits_legumes', 'piece'),
  (gen_random_uuid(), 'poivron', 'fruits_legumes', 'piece'),
  (gen_random_uuid(), 'aubergine', 'fruits_legumes', 'piece'),
  (gen_random_uuid(), 'champignon', 'fruits_legumes', 'g'),
  (gen_random_uuid(), 'salade verte', 'fruits_legumes', 'piece'),
  (gen_random_uuid(), 'epinard', 'fruits_legumes', 'g'),
  (gen_random_uuid(), 'brocoli', 'fruits_legumes', 'piece'),
  (gen_random_uuid(), 'haricot vert', 'fruits_legumes', 'g'),
  (gen_random_uuid(), 'petit pois', 'fruits_legumes', 'g'),
  (gen_random_uuid(), 'citron', 'fruits_legumes', 'piece'),
  (gen_random_uuid(), 'avocat', 'fruits_legumes', 'piece'),
  (gen_random_uuid(), 'concombre', 'fruits_legumes', 'piece'),
  (gen_random_uuid(), 'poireau', 'fruits_legumes', 'piece'),
  (gen_random_uuid(), 'celeri', 'fruits_legumes', 'branche'),
  (gen_random_uuid(), 'navet', 'fruits_legumes', 'piece'),
  (gen_random_uuid(), 'potiron', 'fruits_legumes', 'g'),
  (gen_random_uuid(), 'echalote', 'fruits_legumes', 'piece'),
  (gen_random_uuid(), 'persil', 'fruits_legumes', 'botte'),
  (gen_random_uuid(), 'coriandre', 'fruits_legumes', 'botte'),
  (gen_random_uuid(), 'basilic', 'fruits_legumes', 'botte'),
  (gen_random_uuid(), 'thym', 'fruits_legumes', 'botte'),
  (gen_random_uuid(), 'romarin', 'fruits_legumes', 'botte'),
  (gen_random_uuid(), 'menthe', 'fruits_legumes', 'botte'),
  (gen_random_uuid(), 'gingembre', 'fruits_legumes', 'piece'),
  (gen_random_uuid(), 'lentille verte', 'epicerie', 'g'),
  (gen_random_uuid(), 'pois chiche', 'epicerie', 'g'),
  -- Viandes & Poissons
  (gen_random_uuid(), 'poulet', 'viandes_poissons', 'g'),
  (gen_random_uuid(), 'boeuf', 'viandes_poissons', 'g'),
  (gen_random_uuid(), 'porc', 'viandes_poissons', 'g'),
  (gen_random_uuid(), 'agneau', 'viandes_poissons', 'g'),
  (gen_random_uuid(), 'saumon', 'viandes_poissons', 'g'),
  (gen_random_uuid(), 'cabillaud', 'viandes_poissons', 'g'),
  (gen_random_uuid(), 'crevette', 'viandes_poissons', 'g'),
  (gen_random_uuid(), 'thon', 'viandes_poissons', 'g'),
  (gen_random_uuid(), 'lardon', 'viandes_poissons', 'g'),
  (gen_random_uuid(), 'jambon', 'viandes_poissons', 'tranche'),
  (gen_random_uuid(), 'saucisse', 'viandes_poissons', 'piece'),
  (gen_random_uuid(), 'merlu', 'viandes_poissons', 'g'),
  (gen_random_uuid(), 'moule', 'viandes_poissons', 'kg'),
  -- Produits laitiers
  (gen_random_uuid(), 'beurre', 'produits_laitiers', 'g'),
  (gen_random_uuid(), 'creme fraiche', 'produits_laitiers', 'cl'),
  (gen_random_uuid(), 'lait', 'produits_laitiers', 'ml'),
  (gen_random_uuid(), 'fromage rape', 'produits_laitiers', 'g'),
  (gen_random_uuid(), 'parmesan', 'produits_laitiers', 'g'),
  (gen_random_uuid(), 'mozzarella', 'produits_laitiers', 'g'),
  (gen_random_uuid(), 'chevre', 'produits_laitiers', 'g'),
  (gen_random_uuid(), 'yaourt', 'produits_laitiers', 'piece'),
  (gen_random_uuid(), 'oeuf', 'produits_laitiers', 'piece'),
  -- Boulangerie
  (gen_random_uuid(), 'pain', 'boulangerie', 'piece'),
  (gen_random_uuid(), 'pain de mie', 'boulangerie', 'tranche'),
  (gen_random_uuid(), 'pate brisee', 'boulangerie', 'piece'),
  (gen_random_uuid(), 'pate feuilletee', 'boulangerie', 'piece'),
  (gen_random_uuid(), 'tortilla', 'boulangerie', 'piece'),
  -- Epicerie
  (gen_random_uuid(), 'pate', 'epicerie', 'g'),
  (gen_random_uuid(), 'riz', 'epicerie', 'g'),
  (gen_random_uuid(), 'semoule', 'epicerie', 'g'),
  (gen_random_uuid(), 'farine', 'epicerie', 'g'),
  (gen_random_uuid(), 'huile olive', 'epicerie', 'cs'),
  (gen_random_uuid(), 'vinaigre', 'epicerie', 'cs'),
  (gen_random_uuid(), 'moutarde', 'epicerie', 'cs'),
  (gen_random_uuid(), 'sauce soja', 'epicerie', 'cs'),
  (gen_random_uuid(), 'concentre de tomate', 'epicerie', 'cs'),
  (gen_random_uuid(), 'tomate pelée', 'epicerie', 'g'),
  (gen_random_uuid(), 'bouillon cube', 'epicerie', 'piece'),
  (gen_random_uuid(), 'curry', 'epicerie', 'cc'),
  (gen_random_uuid(), 'cumin', 'epicerie', 'cc'),
  (gen_random_uuid(), 'paprika', 'epicerie', 'cc'),
  (gen_random_uuid(), 'sel', 'epicerie', 'pincee'),
  (gen_random_uuid(), 'poivre', 'epicerie', 'pincee'),
  (gen_random_uuid(), 'sucre', 'epicerie', 'g'),
  (gen_random_uuid(), 'miel', 'epicerie', 'cs'),
  (gen_random_uuid(), 'noix', 'epicerie', 'g'),
  (gen_random_uuid(), 'amande', 'epicerie', 'g'),
  (gen_random_uuid(), 'olive', 'epicerie', 'g'),
  (gen_random_uuid(), 'capre', 'epicerie', 'cs'),
  (gen_random_uuid(), 'lait de coco', 'epicerie', 'ml'),
  (gen_random_uuid(), 'maizena', 'epicerie', 'cs'),
  -- Boissons
  (gen_random_uuid(), 'vin blanc', 'boissons', 'cl'),
  (gen_random_uuid(), 'vin rouge', 'boissons', 'cl')
ON CONFLICT (name) DO NOTHING;

-- ─── Recipes ────────────────────────────────────────────────────────────────
-- Each recipe uses a DO $$ block to reference ingredient IDs by name.
-- This ensures idempotency and correct FK references.

DO $$
DECLARE
  r_id UUID;
  ing_id UUID;
BEGIN

  -- ── Poulet basquaise ──
  INSERT INTO public.recipes (id, title, description, prep_time, cook_time, servings, difficulty, tags, steps, source)
  VALUES (
    gen_random_uuid(),
    'Poulet basquaise',
    'Plat traditionnel du Pays Basque, mijoté aux poivrons et tomates.',
    15, 35, 4, 'easy',
    ARRAY['familial', 'sans-gluten'],
    '[{"order":1,"text":"Couper les poivrons et l''oignon en lamelles."},{"order":2,"text":"Faire dorer les cuisses de poulet dans l''huile d''olive, puis réserver."},{"order":3,"text":"Faire revenir les légumes 5 min, ajouter les tomates pelées."},{"order":4,"text":"Remettre le poulet, couvrir et laisser mijoter 35 min à feu doux."}]'::jsonb,
    'system'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'poulet';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, note) VALUES (r_id, ing_id, 4, 'piece', 'cuisses');
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'poivron';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (r_id, ing_id, 3, 'piece');
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'oignon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (r_id, ing_id, 2, 'piece');
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'tomate pelée';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (r_id, ing_id, 400, 'g');
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'huile olive';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing_id, 3, 'cs', true);
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'sel';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing_id, 1, 'pincee', true);
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'poivre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit, optional) VALUES (r_id, ing_id, 1, 'pincee', true);
  END IF;

  -- ── Gratin dauphinois ──
  INSERT INTO public.recipes (id, title, description, prep_time, cook_time, servings, difficulty, tags, steps, source)
  VALUES (
    gen_random_uuid(),
    'Gratin dauphinois',
    'Gratin onctueux de pommes de terre à la crème, un classique français.',
    20, 50, 6, 'easy',
    ARRAY['familial', 'vegetarien'],
    '[{"order":1,"text":"Préchauffer le four à 180°C."},{"order":2,"text":"Éplucher et couper les pommes de terre en fines rondelles."},{"order":3,"text":"Frotter un plat à gratin avec de l''ail, beurrer généreusement."},{"order":4,"text":"Disposer les pommes de terre en couches, saler, poivrer."},{"order":5,"text":"Mélanger la crème et le lait, verser sur les pommes de terre."},{"order":6,"text":"Enfourner 50 min jusqu''à ce que le dessus soit bien doré."}]'::jsonb,
    'system'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'pomme de terre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (r_id, ing_id, 1000, 'g');
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'creme fraiche';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (r_id, ing_id, 30, 'cl');
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'lait';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (r_id, ing_id, 200, 'ml');
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'ail';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (r_id, ing_id, 2, 'gousse');
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'beurre';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (r_id, ing_id, 20, 'g');
  END IF;

  -- ── Quiche lorraine ──
  INSERT INTO public.recipes (id, title, description, prep_time, cook_time, servings, difficulty, tags, steps, source)
  VALUES (
    gen_random_uuid(),
    'Quiche lorraine',
    'Tarte salée aux lardons et crème, incontournable de la cuisine française.',
    15, 40, 6, 'easy',
    ARRAY['familial'],
    '[{"order":1,"text":"Préchauffer le four à 180°C."},{"order":2,"text":"Étaler la pâte brisée dans un moule, piquer le fond."},{"order":3,"text":"Faire revenir les lardons sans matière grasse."},{"order":4,"text":"Battre les œufs avec la crème, saler et poivrer."},{"order":5,"text":"Répartir les lardons sur la pâte, verser l''appareil."},{"order":6,"text":"Enfourner 35-40 min jusqu''à ce que la quiche soit dorée."}]'::jsonb,
    'system'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_id;

  IF r_id IS NOT NULL THEN
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'pate brisee';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (r_id, ing_id, 1, 'piece');
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'lardon';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (r_id, ing_id, 200, 'g');
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'oeuf';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (r_id, ing_id, 3, 'piece');
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'creme fraiche';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (r_id, ing_id, 25, 'cl');
    SELECT id INTO ing_id FROM public.ingredients WHERE name = 'fromage rape';
    INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (r_id, ing_id, 50, 'g');
  END IF;

  -- The implementer should continue this pattern for the remaining recipes.
  -- Target: ~50 recipes covering all categories from the spec:
  -- Viandes (~10), Poissons (~6), Vegetarien (~8), Pates & riz (~6),
  -- Soupes (~5), Salades (~4), Gratins & tartes (~5), Plats du monde (~8),
  -- Rapides <30min (~8)
  --
  -- Each recipe MUST:
  -- 1. Use ON CONFLICT DO NOTHING on the INSERT
  -- 2. Use RETURNING id INTO r_id + IF r_id IS NOT NULL guard
  -- 3. Reference ingredients by name via SELECT id INTO ing_id
  -- 4. Mark sel, poivre, huile olive as optional = true

END $$;
```

**Important for the implementer:** The above shows 3 complete recipes as the pattern. You must add ~47 more following the exact same structure. Cover all 9 categories from the spec. Every recipe needs proper steps, ingredients with correct quantities/units, and appropriate tags.

- [ ] **Step 2: Apply the seed migration**

Run: `npx supabase db push`
Expected: Seed applied, verify with: `SELECT count(*) FROM recipes WHERE source = 'system';` should return ~50.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/022_meals_seed.sql
git commit -m "feat(db): seed meal planning data — ingredients and starter recipes"
```

---

## Task 3: TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add meal-related types**

Add the following block at the end of the file, before the `// ─── Utility Types` section:

```typescript
// ─── Meals & Recipes ──────────────────────────────────────────────────────────

export type RecipeDifficulty = 'easy' | 'medium' | 'hard';
export type RecipeSource = 'system' | 'user';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Ingredient {
  id: string;
  name: string;
  category: ShoppingItemCategory;
  default_unit: string;
  created_at: string;
}

export interface Recipe {
  id: string;
  household_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: RecipeDifficulty;
  tags: string[];
  steps: { order: number; text: string }[];
  source: RecipeSource;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  ingredients?: RecipeIngredient[];
  is_favorite?: boolean;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  optional: boolean;
  note: string | null;
  // Joined
  ingredient?: Ingredient;
}

export interface MealPlanItem {
  id: string;
  household_id: string;
  recipe_id: string;
  date: string;
  meal_type: MealType;
  servings: number;
  assigned_to: string | null;
  task_id: string | null;
  created_by: string;
  created_at: string;
  // Joined
  recipe?: Recipe;
  assigned_profile?: Profile;
  task?: Task;
}

export interface RecipeFavorite {
  id: string;
  user_id: string;
  recipe_id: string;
  created_at: string;
}

// ─── Meal Form Types ──────────────────────────────────────────────────────────

export interface RecipeFormValues {
  title: string;
  description?: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: RecipeDifficulty;
  tags: string[];
  steps: { order: number; text: string }[];
  ingredients: {
    ingredient_id: string;
    quantity: number;
    unit: string;
    optional: boolean;
    note?: string;
  }[];
}

export interface MealPlanFormValues {
  recipe_id: string;
  date: string;
  meal_type: MealType;
  servings: number;
  assigned_to?: string;
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No new errors related to meal types.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add meal planning types — Recipe, Ingredient, MealPlanItem"
```

---

## Task 4: TanStack Query Hooks — Recipes

**Files:**
- Create: `src/lib/queries/recipes.ts`

- [ ] **Step 1: Write the recipes query hooks**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useHouseholdStore } from '../../stores/household.store';
import { useAuthStore } from '../../stores/auth.store';
import type {
  Recipe,
  RecipeIngredient,
  Ingredient,
  RecipeFavorite,
  RecipeFormValues,
} from '../../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const recipeKeys = {
  all: ['recipes'] as const,
  catalog: (householdId: string) => ['recipes', 'catalog', householdId] as const,
  byId: (id: string) => ['recipes', 'detail', id] as const,
  favorites: (userId: string) => ['recipes', 'favorites', userId] as const,
  ingredientSearch: (query: string) => ['ingredients', 'search', query] as const,
};

// ─── Fetch Recipes (catalog) ─────────────────────────────────────────────────

interface RecipeFilters {
  search?: string;
  tags?: string[];
  difficulty?: string;
  maxTime?: number; // total prep+cook in minutes
  source?: 'system' | 'user';
}

async function fetchRecipes(
  householdId: string,
  userId: string,
  filters?: RecipeFilters
): Promise<Recipe[]> {
  let query = supabase
    .from('recipes')
    .select('*')
    .or(`source.eq.system,household_id.eq.${householdId}`)
    .order('title', { ascending: true });

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }
  if (filters?.difficulty) {
    query = query.eq('difficulty', filters.difficulty);
  }
  if (filters?.source) {
    query = query.eq('source', filters.source);
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let recipes = (data as Recipe[]) ?? [];

  // Client-side filter for max time (prep_time + cook_time)
  if (filters?.maxTime) {
    recipes = recipes.filter(
      (r) => r.prep_time + r.cook_time <= filters.maxTime!
    );
  }

  // Fetch favorites for this user to mark recipes
  const { data: favs } = await supabase
    .from('recipe_favorites')
    .select('recipe_id')
    .eq('user_id', userId);

  const favSet = new Set((favs ?? []).map((f: { recipe_id: string }) => f.recipe_id));
  return recipes.map((r) => ({ ...r, is_favorite: favSet.has(r.id) }));
}

export function useRecipes(filters?: RecipeFilters) {
  const { currentHousehold } = useHouseholdStore();
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [...recipeKeys.catalog(currentHousehold?.id ?? ''), filters],
    queryFn: () => fetchRecipes(currentHousehold!.id, user!.id, filters),
    enabled: !!currentHousehold?.id && !!user?.id,
    staleTime: 1000 * 60, // 1 min
  });
}

// ─── Fetch Recipe by ID (with ingredients) ───────────────────────────────────

async function fetchRecipe(id: string, userId: string): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      ingredients:recipe_ingredients(
        id, recipe_id, ingredient_id, quantity, unit, optional, note,
        ingredient:ingredients(id, name, category, default_unit)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);

  // Check if favorited
  const { data: fav } = await supabase
    .from('recipe_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('recipe_id', id)
    .maybeSingle();

  return { ...(data as Recipe), is_favorite: !!fav };
}

export function useRecipe(id: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: recipeKeys.byId(id),
    queryFn: () => fetchRecipe(id, user!.id),
    enabled: !!id && !!user?.id,
  });
}

// ─── Create Recipe ───────────────────────────────────────────────────────────

export function useCreateRecipe() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (values: RecipeFormValues) => {
      // 1. Create recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          household_id: currentHousehold!.id,
          title: values.title,
          description: values.description || null,
          prep_time: values.prep_time,
          cook_time: values.cook_time,
          servings: values.servings,
          difficulty: values.difficulty,
          tags: values.tags,
          steps: values.steps,
          source: 'user' as const,
          created_by: user!.id,
        })
        .select()
        .single();

      if (recipeError) throw new Error(recipeError.message);

      // 2. Create recipe_ingredients
      if (values.ingredients.length > 0) {
        const { error: ingError } = await supabase
          .from('recipe_ingredients')
          .insert(
            values.ingredients.map((ing) => ({
              recipe_id: recipe.id,
              ingredient_id: ing.ingredient_id,
              quantity: ing.quantity,
              unit: ing.unit,
              optional: ing.optional,
              note: ing.note || null,
            }))
          );
        if (ingError) throw new Error(ingError.message);
      }

      return recipe as Recipe;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.catalog(currentHousehold!.id) });
    },
  });
}

// ─── Toggle Favorite ─────────────────────────────────────────────────────────

export function useToggleFavorite() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({
      recipeId,
      isFavorite,
    }: {
      recipeId: string;
      isFavorite: boolean;
    }) => {
      if (isFavorite) {
        const { error } = await supabase
          .from('recipe_favorites')
          .delete()
          .eq('user_id', user!.id)
          .eq('recipe_id', recipeId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('recipe_favorites')
          .insert({ user_id: user!.id, recipe_id: recipeId });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: (_, { recipeId }) => {
      qc.invalidateQueries({ queryKey: recipeKeys.byId(recipeId) });
      qc.invalidateQueries({ queryKey: recipeKeys.favorites(user!.id) });
      qc.invalidateQueries({ queryKey: recipeKeys.catalog(currentHousehold!.id) });
    },
  });
}

// ─── Favorite Recipes ────────────────────────────────────────────────────────

export function useFavoriteRecipes() {
  const user = useAuthStore((s) => s.user);
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: recipeKeys.favorites(user?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipe_favorites')
        .select(`
          id, created_at,
          recipe:recipes(*)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      return (data ?? []).map((f: { recipe: Recipe }) => ({
        ...f.recipe,
        is_favorite: true,
      })) as Recipe[];
    },
    enabled: !!user?.id && !!currentHousehold?.id,
  });
}

// ─── Ingredient Search (autocomplete) ────────────────────────────────────────

export function useIngredientSearch(query: string) {
  return useQuery({
    queryKey: recipeKeys.ingredientSearch(query),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(20);

      if (error) throw new Error(error.message);
      return (data as Ingredient[]) ?? [];
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 min — ingredients rarely change
  });
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/recipes.ts
git commit -m "feat(queries): add recipe hooks — catalog, detail, create, favorites, ingredient search"
```

---

## Task 5: TanStack Query Hooks — Meal Plan & Grocery List

**Files:**
- Create: `src/lib/queries/meals.ts`

- [ ] **Step 1: Write the meal plan query hooks**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useHouseholdStore } from '../../stores/household.store';
import { useAuthStore } from '../../stores/auth.store';
import { listKeys } from './lists';
import { taskKeys } from './tasks';
import type {
  MealPlanItem,
  MealPlanFormValues,
  RecipeIngredient,
  Ingredient,
} from '../../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const mealKeys = {
  all: ['meals'] as const,
  plan: (householdId: string, weekStart: string) =>
    ['meals', 'plan', householdId, weekStart] as const,
  history: (householdId: string) => ['meals', 'history', householdId] as const,
};

// ─── Fetch Meal Plan (week) ──────────────────────────────────────────────────

async function fetchMealPlan(
  householdId: string,
  weekStart: string
): Promise<MealPlanItem[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('meal_plan_items')
    .select(`
      *,
      recipe:recipes(id, title, description, image_url, prep_time, cook_time, servings, difficulty, tags),
      assigned_profile:profiles!meal_plan_items_assigned_to_fkey(id, full_name, avatar_url)
    `)
    .eq('household_id', householdId)
    .gte('date', weekStart)
    .lte('date', weekEndStr)
    .order('date', { ascending: true })
    .order('meal_type', { ascending: true });

  if (error) throw new Error(error.message);
  return (data as MealPlanItem[]) ?? [];
}

export function useMealPlan(weekStart: string) {
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: mealKeys.plan(currentHousehold?.id ?? '', weekStart),
    queryFn: () => fetchMealPlan(currentHousehold!.id, weekStart),
    enabled: !!currentHousehold?.id && !!weekStart,
    staleTime: 1000 * 30,
  });
}

// ─── Create Meal Plan Item ───────────────────────────────────────────────────
// Creates the meal_plan_item + a household task + adds ingredients to grocery list

export function useCreateMealPlanItem() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (values: MealPlanFormValues) => {
      const householdId = currentHousehold!.id;
      const userId = user!.id;

      // 1. Fetch recipe for task title and time estimate
      const { data: recipe, error: recipeErr } = await supabase
        .from('recipes')
        .select('title, prep_time, cook_time')
        .eq('id', values.recipe_id)
        .single();
      if (recipeErr) throw new Error(recipeErr.message);

      // 2. Create household task
      const { data: task, error: taskErr } = await supabase
        .from('tasks')
        .insert({
          household_id: householdId,
          title: `Cuisiner : ${recipe.title}`,
          task_type: 'household',
          category: 'cooking',
          assigned_to: values.assigned_to || null,
          due_date: values.date,
          estimated_minutes: recipe.prep_time + recipe.cook_time,
          status: 'todo',
          priority: 'medium',
          zone: 'kitchen',
          recurrence: 'none',
          created_by: userId,
        })
        .select('id')
        .single();
      if (taskErr) throw new Error(taskErr.message);

      // 3. Create meal_plan_item
      const { data: item, error: itemErr } = await supabase
        .from('meal_plan_items')
        .insert({
          household_id: householdId,
          recipe_id: values.recipe_id,
          date: values.date,
          meal_type: values.meal_type,
          servings: values.servings,
          assigned_to: values.assigned_to || null,
          task_id: task.id,
          created_by: userId,
        })
        .select()
        .single();
      if (itemErr) throw new Error(itemErr.message);

      // 4. Add ingredients to active grocery list
      await addIngredientsToGroceryList(
        householdId,
        userId,
        values.recipe_id,
        values.servings
      );

      return item as MealPlanItem;
    },
    onSuccess: () => {
      const householdId = currentHousehold!.id;
      qc.invalidateQueries({ queryKey: mealKeys.all });
      qc.invalidateQueries({ queryKey: taskKeys.byHousehold(householdId) });
      qc.invalidateQueries({ queryKey: listKeys.byHousehold(householdId) });
    },
  });
}

// ─── Delete Meal Plan Item ───────────────────────────────────────────────────

export function useDeleteMealPlanItem() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async ({
      id,
      taskId,
    }: {
      id: string;
      taskId: string | null;
    }) => {
      // 1. Delete the meal plan item
      const { error: itemErr } = await supabase
        .from('meal_plan_items')
        .delete()
        .eq('id', id);
      if (itemErr) throw new Error(itemErr.message);

      // 2. Delete linked task if not yet completed
      if (taskId) {
        const { data: task } = await supabase
          .from('tasks')
          .select('status')
          .eq('id', taskId)
          .single();

        if (task && task.status !== 'done') {
          await supabase.from('tasks').delete().eq('id', taskId);
        }
      }
    },
    onSuccess: () => {
      const householdId = currentHousehold!.id;
      qc.invalidateQueries({ queryKey: mealKeys.all });
      qc.invalidateQueries({ queryKey: taskKeys.byHousehold(householdId) });
    },
  });
}

// ─── Meal History & Suggestions ──────────────────────────────────────────────

export function useMealHistory(months: number = 3) {
  const { currentHousehold } = useHouseholdStore();

  return useQuery({
    queryKey: mealKeys.history(currentHousehold?.id ?? ''),
    queryFn: async () => {
      const since = new Date();
      since.setMonth(since.getMonth() - months);
      const sinceStr = since.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('meal_plan_items')
        .select(`
          id, date, meal_type, recipe_id,
          recipe:recipes(id, title, image_url, prep_time, cook_time, servings, difficulty, tags)
        `)
        .eq('household_id', currentHousehold!.id)
        .gte('date', sinceStr)
        .order('date', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as MealPlanItem[]) ?? [];
    },
    enabled: !!currentHousehold?.id,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Generate Grocery List ───────────────────────────────────────────────────

interface GenerateGroceryListParams {
  startDate: string;
  endDate: string;
  mergeWithExisting: boolean;
  excludeBasics: boolean;
}

export function useGenerateGroceryList() {
  const qc = useQueryClient();
  const { currentHousehold } = useHouseholdStore();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (params: GenerateGroceryListParams) => {
      const householdId = currentHousehold!.id;
      const userId = user!.id;

      // 1. Fetch all meal_plan_items in date range
      const { data: items, error: itemsErr } = await supabase
        .from('meal_plan_items')
        .select('recipe_id, servings')
        .eq('household_id', householdId)
        .gte('date', params.startDate)
        .lte('date', params.endDate);

      if (itemsErr) throw new Error(itemsErr.message);
      if (!items || items.length === 0) throw new Error('Aucun repas planifié sur cette période.');

      // 2. Fetch recipe ingredients for all recipes
      const recipeIds = [...new Set(items.map((i) => i.recipe_id))];
      const { data: recipeIngs, error: ingsErr } = await supabase
        .from('recipe_ingredients')
        .select(`
          recipe_id, quantity, unit, optional, note,
          ingredient:ingredients(id, name, category, default_unit)
        `)
        .in('recipe_id', recipeIds);

      if (ingsErr) throw new Error(ingsErr.message);

      // 3. Build a map: recipe_id -> default servings
      const { data: recipeMeta } = await supabase
        .from('recipes')
        .select('id, servings')
        .in('id', recipeIds);

      const recipeServingsMap = new Map(
        (recipeMeta ?? []).map((r: { id: string; servings: number }) => [r.id, r.servings])
      );

      // 4. Aggregate ingredients across all meals, adjusting for servings
      const aggregated = new Map<
        string,
        { name: string; category: string; quantity: number; unit: string }
      >();

      for (const item of items) {
        const defaultServings = recipeServingsMap.get(item.recipe_id) ?? 4;
        const ratio = item.servings / defaultServings;

        const recipeIngredients = (recipeIngs ?? []).filter(
          (ri: { recipe_id: string }) => ri.recipe_id === item.recipe_id
        );

        for (const ri of recipeIngredients) {
          const ing = (ri as { ingredient: Ingredient }).ingredient;
          if (!ing) continue;

          // Skip basics if option is set
          if (params.excludeBasics && (ri as { optional: boolean }).optional) continue;

          const key = `${ing.id}-${(ri as { unit: string }).unit}`;
          const existing = aggregated.get(key);
          const adjustedQty = (ri as { quantity: number }).quantity * ratio;

          if (existing) {
            existing.quantity += adjustedQty;
          } else {
            aggregated.set(key, {
              name: ing.name,
              category: ing.category,
              quantity: adjustedQty,
              unit: (ri as { unit: string }).unit,
            });
          }
        }
      }

      // 5. Create or find existing grocery list
      let listId: string;

      if (params.mergeWithExisting) {
        // Find most recent non-archived shopping list
        const { data: existingLists } = await supabase
          .from('shared_lists')
          .select('id')
          .eq('household_id', householdId)
          .eq('type', 'shopping')
          .eq('archived', false)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (existingLists && existingLists.length > 0) {
          listId = existingLists[0].id;
        } else {
          // Create new list
          const { data: newList, error: listErr } = await supabase
            .from('shared_lists')
            .insert({
              household_id: householdId,
              title: `Courses semaine`,
              type: 'shopping',
              created_by: userId,
            })
            .select('id')
            .single();
          if (listErr) throw new Error(listErr.message);
          listId = newList.id;
        }
      } else {
        const { data: newList, error: listErr } = await supabase
          .from('shared_lists')
          .insert({
            household_id: householdId,
            title: `Courses semaine`,
            type: 'shopping',
            created_by: userId,
          })
          .select('id')
          .single();
        if (listErr) throw new Error(listErr.message);
        listId = newList.id;
      }

      // 6. Insert aggregated items
      const listItems = [...aggregated.values()].map((item, index) => ({
        list_id: listId,
        title: item.name,
        quantity: `${Math.round(item.quantity * 10) / 10}${item.unit}`,
        category: item.category,
        position: index,
        created_by: userId,
      }));

      if (listItems.length > 0) {
        const { error: insertErr } = await supabase
          .from('shared_list_items')
          .insert(listItems);
        if (insertErr) throw new Error(insertErr.message);
      }

      return listId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listKeys.byHousehold(currentHousehold!.id) });
    },
  });
}

// ─── Helper: Add recipe ingredients to active grocery list ───────────────────

async function addIngredientsToGroceryList(
  householdId: string,
  userId: string,
  recipeId: string,
  servings: number
) {
  // Fetch recipe ingredients
  const { data: recipeIngs } = await supabase
    .from('recipe_ingredients')
    .select(`
      quantity, unit, optional,
      ingredient:ingredients(id, name, category)
    `)
    .eq('recipe_id', recipeId);

  if (!recipeIngs || recipeIngs.length === 0) return;

  // Get default servings
  const { data: recipe } = await supabase
    .from('recipes')
    .select('servings')
    .eq('id', recipeId)
    .single();

  const ratio = servings / (recipe?.servings ?? 4);

  // Find or create active grocery list
  const { data: existingLists } = await supabase
    .from('shared_lists')
    .select('id')
    .eq('household_id', householdId)
    .eq('type', 'shopping')
    .eq('archived', false)
    .order('updated_at', { ascending: false })
    .limit(1);

  let listId: string;
  if (existingLists && existingLists.length > 0) {
    listId = existingLists[0].id;
  } else {
    const { data: newList, error } = await supabase
      .from('shared_lists')
      .insert({
        household_id: householdId,
        title: 'Courses',
        type: 'shopping',
        created_by: userId,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    listId = newList.id;
  }

  // Insert non-optional ingredients
  const items = recipeIngs
    .filter((ri) => !(ri as { optional: boolean }).optional)
    .map((ri, index) => {
      const ing = (ri as { ingredient: { id: string; name: string; category: string } }).ingredient;
      const qty = (ri as { quantity: number }).quantity * ratio;
      return {
        list_id: listId,
        title: ing.name,
        quantity: `${Math.round(qty * 10) / 10}${(ri as { unit: string }).unit}`,
        category: ing.category,
        position: index,
        created_by: userId,
      };
    });

  if (items.length > 0) {
    await supabase.from('shared_list_items').insert(items);
  }
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/meals.ts
git commit -m "feat(queries): add meal plan hooks — CRUD, history, grocery list generation"
```

---

## Task 6: UI Components — MealCard, MealPlanDay, RecipeCard

**Files:**
- Create: `src/components/meals/MealCard.tsx`
- Create: `src/components/meals/MealPlanDay.tsx`
- Create: `src/components/meals/RecipeCard.tsx`
- Create: `src/components/meals/RecipeFilters.tsx`
- Create: `src/components/meals/IngredientRow.tsx`
- Create: `src/components/meals/StepRow.tsx`

- [ ] **Step 1: Create MealCard**

`src/components/meals/MealCard.tsx` — A card for a planned meal showing recipe name, meal type, assigned cook avatar, and serving count. Used inside `MealPlanDay`.

```typescript
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { MealPlanItem, MealType } from '../../types';

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Goûter',
};

interface MealCardProps {
  item: MealPlanItem;
  onPress: () => void;
  onDelete: () => void;
}

export function MealCard({ item, onPress, onDelete }: MealCardProps) {
  const profile = item.assigned_profile;
  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? '?';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.content}>
        <Text style={styles.mealType}>
          {mealTypeLabels[item.meal_type]}
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {item.recipe?.title ?? 'Recette'}
        </Text>
      </View>
      <View style={styles.right}>
        {profile && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        <Text style={styles.servings}>{item.servings} pers.</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  content: {
    flex: 1,
  },
  mealType: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  title: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 9,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  servings: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
});
```

- [ ] **Step 2: Create MealPlanDay**

`src/components/meals/MealPlanDay.tsx` — A day section in the weekly planner.

```typescript
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';
import { MealCard } from './MealCard';
import type { MealPlanItem } from '../../types';

const DAY_NAMES = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const MONTH_NAMES = [
  'JANV.', 'FÉV.', 'MARS', 'AVR.', 'MAI', 'JUIN',
  'JUIL.', 'AOÛT', 'SEPT.', 'OCT.', 'NOV.', 'DÉC.',
];

interface MealPlanDayProps {
  date: Date;
  items: MealPlanItem[];
  onMealPress: (item: MealPlanItem) => void;
  onMealDelete: (item: MealPlanItem) => void;
  onAddPress: () => void;
}

export function MealPlanDay({
  date,
  items,
  onMealPress,
  onMealDelete,
  onAddPress,
}: MealPlanDayProps) {
  const dayLabel = `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;

  return (
    <View style={styles.container}>
      <Text style={styles.dayLabel}>{dayLabel}</Text>
      {items.length > 0 ? (
        <View style={styles.meals}>
          {items.map((item) => (
            <MealCard
              key={item.id}
              item={item}
              onPress={() => onMealPress(item)}
              onDelete={() => onMealDelete(item)}
            />
          ))}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.emptySlot}
          onPress={onAddPress}
          activeOpacity={0.7}
        >
          <Text style={styles.emptyText}>+ Ajouter un repas</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  dayLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.terracotta,
    marginBottom: Spacing.sm,
  },
  meals: {
    gap: Spacing.sm,
  },
  emptySlot: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
});
```

- [ ] **Step 3: Create RecipeCard**

`src/components/meals/RecipeCard.tsx` — A card for a recipe in the catalog grid.

```typescript
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { Recipe } from '../../types';

const difficultyConfig = {
  easy: { label: 'Facile', color: Colors.sauge },
  medium: { label: 'Moyen', color: Colors.miel },
  hard: { label: 'Difficile', color: Colors.rose },
};

// Stable gradient colors based on recipe title hash
const gradients = [
  [Colors.terracotta, Colors.rose],
  [Colors.sauge, '#6BA08F'],
  [Colors.miel, Colors.terracotta],
  [Colors.prune, '#C48BA0'],
  ['#7EB3C4', Colors.prune],
];

function titleHash(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onToggleFavorite: () => void;
  compact?: boolean;
}

export function RecipeCard({
  recipe,
  onPress,
  onToggleFavorite,
  compact = false,
}: RecipeCardProps) {
  const diff = difficultyConfig[recipe.difficulty];
  const totalTime = recipe.prep_time + recipe.cook_time;
  const timeLabel =
    totalTime >= 60
      ? `${Math.floor(totalTime / 60)}h${totalTime % 60 > 0 ? totalTime % 60 : ''}`
      : `${totalTime}min`;

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Color header (placeholder for image) */}
      <View style={[styles.imageArea, compact && styles.imageAreaCompact]}>
        {recipe.source === 'user' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Foyer</Text>
          </View>
        )}
        <View style={styles.diffBadge}>
          <Text style={[styles.diffText, { color: diff.color }]}>{diff.label}</Text>
        </View>
        <TouchableOpacity
          style={styles.favButton}
          onPress={(e) => {
            e.stopPropagation?.();
            onToggleFavorite();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.favIcon}>{recipe.is_favorite ? '❤️' : '♡'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {recipe.title}
        </Text>
        <Text style={styles.meta}>
          ⏱ {timeLabel} · 👤 {recipe.servings}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardCompact: {
    minWidth: 150,
  },
  imageArea: {
    height: 70,
    backgroundColor: Colors.terracotta,
    position: 'relative',
  },
  imageAreaCompact: {
    height: 80,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 9,
    color: Colors.terracotta,
    fontWeight: '600',
  },
  diffBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  diffText: {
    fontSize: 9,
    fontWeight: '600',
  },
  favButton: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  favIcon: {
    fontSize: 14,
  },
  body: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  meta: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
```

- [ ] **Step 4: Create RecipeFilters**

`src/components/meals/RecipeFilters.tsx` — Horizontal scrollable filter chips.

```typescript
import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';

const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'rapide', label: 'Rapide (<30min)' },
  { key: 'vegetarien', label: 'Végétarien' },
  { key: 'familial', label: 'Familial' },
  { key: 'batch-cooking', label: 'Batch cooking' },
  { key: 'economique', label: 'Économique' },
  { key: 'sans-gluten', label: 'Sans gluten' },
];

interface RecipeFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function RecipeFilters({ activeFilter, onFilterChange }: RecipeFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((f) => {
        const isActive = activeFilter === f.key;
        return (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onFilterChange(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.backgroundCard,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.terracotta,
    borderColor: Colors.terracotta,
  },
  chipText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
});
```

- [ ] **Step 5: Create IngredientRow and StepRow**

`src/components/meals/IngredientRow.tsx`:

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { RecipeIngredient } from '../../types';

interface IngredientRowProps {
  item: RecipeIngredient;
  servingsRatio: number; // current servings / default servings
}

export function IngredientRow({ item, servingsRatio }: IngredientRowProps) {
  const adjustedQty = Math.round(item.quantity * servingsRatio * 10) / 10;
  const name = item.ingredient?.name ?? '';
  const note = item.note ? ` (${item.note})` : '';

  return (
    <View style={styles.row}>
      <Text style={styles.name} numberOfLines={1}>
        {name}{note}
      </Text>
      <Text style={styles.qty}>
        {adjustedQty} {item.unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  name: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  qty: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
});
```

`src/components/meals/StepRow.tsx`:

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/tokens';
import { Text } from '../ui/Text';

interface StepRowProps {
  stepNumber: number;
  text: string;
}

export function StepRow({ stepNumber, text }: StepRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{stepNumber}</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textInverse,
    fontWeight: '600',
  },
  text: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    flex: 1,
  },
});
```

- [ ] **Step 6: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/meals/
git commit -m "feat(ui): add meal planning components — MealCard, MealPlanDay, RecipeCard, filters, ingredient/step rows"
```

---

## Task 7: Screen — Meals Layout + Weekly Planner

**Files:**
- Create: `app/(app)/meals/_layout.tsx`
- Create: `app/(app)/meals/index.tsx`

- [ ] **Step 1: Create the meals layout**

`app/(app)/meals/_layout.tsx`:

```typescript
import { Stack } from 'expo-router';
import { Colors } from '../../../src/constants/tokens';

export default function MealsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="recipes/index" />
      <Stack.Screen name="recipes/[id]" />
      <Stack.Screen
        name="recipes/create"
        options={{
          presentation: 'transparentModal',
          animation: 'none',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          presentation: 'transparentModal',
          animation: 'none',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen name="history" />
      <Stack.Screen name="favorites" />
    </Stack>
  );
}
```

- [ ] **Step 2: Create the weekly planner screen**

`app/(app)/meals/index.tsx` — Main screen with week navigation, daily meal cards, suggestions carousel, and FAB. This is a large screen; the implementer should follow the mockup from the spec closely. Key elements:

- Header with "Repas" title, "Liste de courses" and "Recettes" action buttons
- Week navigation (arrows + week label)
- For each day in the week: `MealPlanDay` component with meals or empty placeholder
- Suggestions carousel at the bottom (from `useMealHistory`)
- FAB "+" to add a meal → navigates to `/(app)/meals/add`

The implementer should use `useMealPlan(weekStart)` for the main data, `useMealHistory()` for suggestions, and follow the existing screen patterns (SafeAreaView, ScrollView, Cafe Cosy tokens).

```typescript
import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Loader } from '../../../src/components/ui/Loader';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { MealPlanDay } from '../../../src/components/meals/MealPlanDay';
import { RecipeCard } from '../../../src/components/meals/RecipeCard';
import { useMealPlan, useDeleteMealPlanItem, useMealHistory } from '../../../src/lib/queries/meals';
import { useToggleFavorite } from '../../../src/lib/queries/recipes';
import { useHouseholdStore } from '../../../src/stores/household.store';
import type { MealPlanItem, Recipe } from '../../../src/types';

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(d.setDate(diff));
}

function formatWeekLabel(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} — ${end.getDate()} ${months[start.getMonth()]} ${start.getFullYear()}`;
  }
  return `${start.getDate()} ${months[start.getMonth()]} — ${end.getDate()} ${months[end.getMonth()]}`;
}

export default function MealsScreen() {
  const router = useRouter();
  const { currentHousehold } = useHouseholdStore();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    const ws = getWeekStart(new Date());
    ws.setDate(ws.getDate() + weekOffset * 7);
    return ws;
  }, [weekOffset]);

  const weekStartStr = weekStart.toISOString().split('T')[0];
  const { data: meals = [], isLoading } = useMealPlan(weekStartStr);
  const { data: history = [] } = useMealHistory();
  const deleteMeal = useDeleteMealPlanItem();
  const toggleFav = useToggleFavorite();

  // Group meals by date
  const days = useMemo(() => {
    const result: { date: Date; items: MealPlanItem[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: d,
        items: meals.filter((m) => m.date === dateStr),
      });
    }
    return result;
  }, [weekStart, meals]);

  // Suggestions: most frequent recipes from history
  const suggestions = useMemo(() => {
    const freq = new Map<string, { count: number; recipe: Recipe }>();
    for (const item of history) {
      if (!item.recipe) continue;
      const existing = freq.get(item.recipe_id);
      if (existing) {
        existing.count++;
      } else {
        freq.set(item.recipe_id, { count: 1, recipe: item.recipe });
      }
    }
    return [...freq.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((f) => f.recipe);
  }, [history]);

  const handleMealPress = useCallback(
    (item: MealPlanItem) => {
      if (item.recipe_id) {
        router.push(`/(app)/meals/recipes/${item.recipe_id}`);
      }
    },
    [router]
  );

  const handleMealDelete = useCallback(
    (item: MealPlanItem) => {
      deleteMeal.mutate({ id: item.id, taskId: item.task_id });
    },
    [deleteMeal]
  );

  const handleAddPress = useCallback(() => {
    router.push('/(app)/meals/add');
  }, [router]);

  if (!currentHousehold) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          variant="household"
          title="Rejoignez un foyer"
          subtitle="Vous devez faire partie d'un foyer pour planifier les repas."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Repas</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push('/(app)/meals/recipes')}
            >
              <Text style={styles.headerBtnText}>Recettes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Week nav */}
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={() => setWeekOffset((o) => o - 1)}>
            <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.weekLabel}>{formatWeekLabel(weekStart)}</Text>
          <TouchableOpacity onPress={() => setWeekOffset((o) => o + 1)}>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <Loader />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Days */}
          {days.map((day) => (
            <MealPlanDay
              key={day.date.toISOString()}
              date={day.date}
              items={day.items}
              onMealPress={handleMealPress}
              onMealDelete={handleMealDelete}
              onAddPress={handleAddPress}
            />
          ))}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsSection}>
              <Text style={styles.sectionTitle}>Suggestions pour vous</Text>
              <FlatList
                horizontal
                data={suggestions}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsScroll}
                renderItem={({ item }) => (
                  <View style={styles.suggestionCard}>
                    <RecipeCard
                      recipe={item}
                      compact
                      onPress={() => router.push(`/(app)/meals/recipes/${item.id}`)}
                      onToggleFavorite={() =>
                        toggleFav.mutate({
                          recipeId: item.id,
                          isFavorite: !!item.is_favorite,
                        })
                      }
                    />
                  </View>
                )}
              />
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddPress}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={24} color={Colors.textInverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerBtn: {
    backgroundColor: `${Colors.terracotta}22`,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  headerBtnText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.terracotta,
    fontWeight: '600',
  },
  weekNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  weekLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  suggestionsSection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  suggestionsScroll: {
    gap: Spacing.md,
  },
  suggestionCard: {
    width: 150,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: BorderRadius.fab,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/meals/_layout.tsx app/\(app\)/meals/index.tsx
git commit -m "feat(screens): add meals layout and weekly planner screen"
```

---

## Task 8: Screen — Recipe Catalog

**Files:**
- Create: `app/(app)/meals/recipes/index.tsx`

- [ ] **Step 1: Create the catalog screen**

Full screen with: search bar, RecipeFilters chips, "Nos recettes" (household) horizontal carousel, "Catalogue" (system) 2-column grid, FAB to create recipe. Uses `useRecipes(filters)` with debounced search, `RecipeCard`, `RecipeFilters`.

The implementer should follow the mockup from the spec. The screen structure is:
1. Header with back button + title + "+" button
2. Search input
3. Filter chips (RecipeFilters)
4. "Nos recettes" section — horizontal FlatList of household recipes (source='user')
5. "Catalogue" section — 2-column grid of system recipes
6. Each RecipeCard navigates to `/(app)/meals/recipes/[id]`

- [ ] **Step 2: Verify and commit**

```bash
git add app/\(app\)/meals/recipes/index.tsx
git commit -m "feat(screens): add recipe catalog screen with search and filters"
```

---

## Task 9: Screen — Recipe Detail

**Files:**
- Create: `app/(app)/meals/recipes/[id].tsx`

- [ ] **Step 1: Create the recipe detail screen**

Full screen with: hero color area, back/favorite buttons, title, description, meta (prep time, cook time, adjustable portions, difficulty), tags, ingredients list (IngredientRow with servingsRatio), steps (StepRow), CTA "Ajouter au planning".

Uses `useRecipe(id)` for data, `useToggleFavorite()` for the heart, portions state that adjusts ingredient quantities via `servingsRatio`. The CTA navigates to `/(app)/meals/add?recipeId={id}&servings={currentServings}`.

- [ ] **Step 2: Verify and commit**

```bash
git add app/\(app\)/meals/recipes/\[id\].tsx
git commit -m "feat(screens): add recipe detail screen with adjustable portions"
```

---

## Task 10: Screen — Add Meal to Plan (Bottom Sheet)

**Files:**
- Create: `app/(app)/meals/add.tsx`

- [ ] **Step 1: Create the add meal bottom sheet**

Modal screen (transparentModal in layout) with:
1. Recipe picker (if not passed via params) — navigate to catalog to select
2. Date picker
3. Meal type selector (breakfast/lunch/dinner/snack chips)
4. Cook assignment (household member picker)
5. Servings adjuster (+/-)
6. CTA "Ajouter au planning"

Uses `useCreateMealPlanItem()` mutation. On success, navigates back to the planner. Reads `recipeId` and `servings` from route params if coming from recipe detail.

- [ ] **Step 2: Verify and commit**

```bash
git add app/\(app\)/meals/add.tsx
git commit -m "feat(screens): add meal planning bottom sheet — date, cook, servings"
```

---

## Task 11: Screen — Create Recipe

**Files:**
- Create: `app/(app)/meals/recipes/create.tsx`

- [ ] **Step 1: Create the recipe creation form**

Modal screen with react-hook-form + zod:
- Title (required)
- Description (optional)
- Prep time & cook time (number inputs, minutes)
- Servings (number)
- Difficulty (easy/medium/hard chips)
- Tags (multi-select chips from predefined list)
- Ingredients section: add rows with autocomplete (useIngredientSearch), quantity, unit, optional toggle, note
- Steps section: add/remove/reorder text steps
- CTA "Créer la recette"

Uses `useCreateRecipe()` mutation. On success, navigates to the recipe detail.

- [ ] **Step 2: Verify and commit**

```bash
git add app/\(app\)/meals/recipes/create.tsx
git commit -m "feat(screens): add recipe creation form with ingredient autocomplete"
```

---

## Task 12: Screens — History & Favorites

**Files:**
- Create: `app/(app)/meals/history.tsx`
- Create: `app/(app)/meals/favorites.tsx`

- [ ] **Step 1: Create history screen**

List of past meals from `useMealHistory()`, grouped by week. Each entry shows date, recipe title, cook. Tap navigates to recipe detail.

- [ ] **Step 2: Create favorites screen**

Grid of favorite recipes from `useFavoriteRecipes()`. Uses `RecipeCard` in 2-column grid. Tap navigates to recipe detail.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/meals/history.tsx app/\(app\)/meals/favorites.tsx
git commit -m "feat(screens): add meal history and favorites screens"
```

---

## Task 13: Menu Integration

**Files:**
- Modify: `app/(app)/menu/index.tsx`

- [ ] **Step 1: Add "Repas" entry in the Foyer section**

In `app/(app)/menu/index.tsx`, add a new `MenuRow` inside the Foyer `MenuSection`, after the "Listes" row:

```typescript
<MenuRow
  icon="restaurant-outline"
  label="Repas"
  color={Colors.terracotta}
  onPress={() => router.push('/(app)/meals')}
/>
```

- [ ] **Step 2: Optionally add a QuickActionCard**

In the Quick Actions grid, add a card for Repas if there's space in the 2x2 grid, or make it 2x3:

```typescript
<QuickActionCard
  icon="restaurant-outline"
  label="Repas"
  color={Colors.terracotta}
  onPress={() => router.push('/(app)/meals')}
/>
```

- [ ] **Step 3: Verify the menu renders correctly**

Run: `npx expo start --tunnel`
Navigate to Menu → verify "Repas" row appears → tap → verify meals screen opens.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/menu/index.tsx
git commit -m "feat(menu): add Repas entry to Menu screen"
```

---

## Task 14: Verification & Lint

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: No new errors. Fix any that appear.

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Manual test checklist**

Test the following flows on device:

1. **Menu → Repas** : the planner opens, shows current week, empty state with suggestions
2. **Add meal** : FAB → catalog → select recipe → set date/cook/servings → confirm → meal appears in planner + task created
3. **Recipe catalog** : search works, filters work, household/system sections render
4. **Recipe detail** : ingredients adjust with portions, steps display, favorite toggle works
5. **Grocery list generation** : from planner header → select period → generate → list appears in Lists module with aggregated ingredients
6. **Delete meal** : swipe/delete → meal removed, task deleted, ingredients removed from list
7. **TLX flow** : mark cooking task as done → rating bottom sheet appears → score recorded
8. **History** : past meals visible
9. **Favorites** : favorited recipes appear, unfavorite works

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address lint and manual testing issues for meals module"
```

-- Fix: meal_plan_items FK constraints pointed to auth.users instead of public.profiles
-- PostgREST cannot join profiles via FK to auth.users, causing fetchMealPlan to fail

ALTER TABLE meal_plan_items
  DROP CONSTRAINT IF EXISTS meal_plan_items_assigned_to_fkey;

ALTER TABLE meal_plan_items
  DROP CONSTRAINT IF EXISTS meal_plan_items_created_by_fkey;

ALTER TABLE meal_plan_items
  ADD CONSTRAINT meal_plan_items_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES profiles(id);

ALTER TABLE meal_plan_items
  ADD CONSTRAINT meal_plan_items_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id);

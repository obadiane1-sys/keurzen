-- 020_add_task_type_and_ratings.sql
-- Palier 2A: Add task_type to tasks, create task_completion_ratings table

-- ─── 1. Add task_type column ────────────────────────────────────────────────

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'household';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_task_type_check'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_task_type_check CHECK (task_type IN ('household', 'personal'));
  END IF;
END $$;

-- ─── 2. Create task_completion_ratings table ────────────────────────────────

CREATE TABLE IF NOT EXISTS task_completion_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  household_id uuid NOT NULL REFERENCES households(id),
  rating smallint NOT NULL CHECK (rating IN (1, 2, 3)),
  rated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tcr_household_user_rated
ON task_completion_ratings (household_id, user_id, rated_at);

-- ─── 3. RLS for task_completion_ratings ─────────────────────────────────────

ALTER TABLE task_completion_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_insert_own_ratings" ON task_completion_ratings;
CREATE POLICY "users_can_insert_own_ratings"
ON task_completion_ratings FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = task_completion_ratings.household_id
      AND hm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "members_can_read_household_ratings" ON task_completion_ratings;
CREATE POLICY "members_can_read_household_ratings"
ON task_completion_ratings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = task_completion_ratings.household_id
      AND hm.user_id = auth.uid()
  )
);

-- ─── 4. Atomic RPC: complete_task_with_rating ───────────────────────────────

CREATE OR REPLACE FUNCTION complete_task_with_rating(
  p_task_id uuid,
  p_rating smallint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id uuid;
  v_task_type text;
BEGIN
  SELECT t.household_id, t.task_type
  INTO v_household_id, v_task_type
  FROM tasks t
  JOIN household_members hm ON hm.household_id = t.household_id
  WHERE t.id = p_task_id
    AND hm.user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found or access denied';
  END IF;

  IF v_task_type != 'household' THEN
    RAISE EXCEPTION 'Rating only applies to household tasks';
  END IF;

  IF p_rating NOT IN (1, 2, 3) THEN
    RAISE EXCEPTION 'Invalid rating value';
  END IF;

  UPDATE tasks
  SET status = 'done',
      completed_at = now(),
      updated_at = now()
  WHERE id = p_task_id;

  INSERT INTO task_completion_ratings (task_id, user_id, household_id, rating)
  VALUES (p_task_id, auth.uid(), v_household_id, p_rating);
END;
$$;

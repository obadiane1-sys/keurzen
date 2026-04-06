-- 023_weekly_objectives.sql
-- Weekly micro-objectives: one objective per household per week

CREATE TABLE IF NOT EXISTS weekly_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  type text NOT NULL CHECK (type IN ('completion', 'balance', 'tlx', 'streak', 'maintenance')),
  target_value numeric NOT NULL,
  baseline_value numeric NOT NULL,
  current_value numeric NOT NULL DEFAULT 0,
  achieved boolean NOT NULL DEFAULT false,
  achieved_at timestamptz,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id, week_start)
);

-- Index for fast lookup by household + current week
CREATE INDEX IF NOT EXISTS idx_weekly_objectives_household_week
  ON weekly_objectives (household_id, week_start);

-- RLS: members can read their household's objectives
ALTER TABLE weekly_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view household objectives"
  ON weekly_objectives FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policies for clients — only service_role writes.

-- RPC: refresh objective progress (called by client on dashboard refresh)
CREATE OR REPLACE FUNCTION refresh_objective_progress()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id uuid;
  v_objective record;
  v_current numeric;
  v_week_start date;
  v_week_end date;
  v_achieved boolean;
BEGIN
  -- Get user's household
  SELECT household_id INTO v_household_id
  FROM household_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_household_id IS NULL THEN
    RETURN jsonb_build_object('updated', false, 'reason', 'no_household');
  END IF;

  -- Current week start (Monday)
  v_week_start := date_trunc('week', CURRENT_DATE)::date;
  v_week_end := v_week_start + interval '7 days';

  -- Get this week's objective
  SELECT * INTO v_objective
  FROM weekly_objectives
  WHERE household_id = v_household_id
    AND week_start = v_week_start;

  IF v_objective IS NULL THEN
    RETURN jsonb_build_object('updated', false, 'reason', 'no_objective');
  END IF;

  -- Already achieved — no update needed
  IF v_objective.achieved THEN
    RETURN jsonb_build_object('updated', false, 'reason', 'already_achieved');
  END IF;

  -- Compute current value based on type
  CASE v_objective.type
    WHEN 'completion' THEN
      SELECT
        CASE WHEN count(*) = 0 THEN 0
             ELSE round(count(*) FILTER (WHERE status = 'done')::numeric / count(*)::numeric * 100)
        END INTO v_current
      FROM tasks
      WHERE household_id = v_household_id
        AND created_at >= v_week_start
        AND created_at < v_week_end;

    WHEN 'balance' THEN
      SELECT coalesce(max(abs(tasks_delta)) * 100, 0) INTO v_current
      FROM weekly_stats
      WHERE household_id = v_household_id
        AND week_start = v_week_start;

    WHEN 'tlx' THEN
      SELECT coalesce(avg(score), 0) INTO v_current
      FROM tlx_entries
      WHERE household_id = v_household_id
        AND created_at >= v_week_start
        AND created_at < v_week_end;

    WHEN 'streak' THEN
      -- Count consecutive days backwards from today with at least 1 completed task
      WITH daily AS (
        SELECT DISTINCT (completed_at::date) AS d
        FROM tasks
        WHERE household_id = v_household_id
          AND status = 'done'
          AND completed_at >= CURRENT_DATE - interval '30 days'
      ),
      streak AS (
        SELECT count(*) AS days
        FROM generate_series(0, 29) AS i
        WHERE (CURRENT_DATE - i) IN (SELECT d FROM daily)
          AND NOT EXISTS (
            SELECT 1 FROM generate_series(0, i - 1) AS j
            WHERE (CURRENT_DATE - j) NOT IN (SELECT d FROM daily)
          )
      )
      SELECT coalesce(days, 0) INTO v_current FROM streak;

    WHEN 'maintenance' THEN
      -- Household score: simplified — use completion as proxy
      SELECT
        CASE WHEN count(*) = 0 THEN 100
             ELSE round(count(*) FILTER (WHERE status = 'done')::numeric / count(*)::numeric * 100)
        END INTO v_current
      FROM tasks
      WHERE household_id = v_household_id
        AND created_at >= v_week_start
        AND created_at < v_week_end;

    ELSE
      v_current := 0;
  END CASE;

  -- Check achievement (balance and tlx are inverted: lower is better)
  IF v_objective.type IN ('balance', 'tlx') THEN
    v_achieved := v_current <= v_objective.target_value;
  ELSE
    v_achieved := v_current >= v_objective.target_value;
  END IF;

  -- Update
  UPDATE weekly_objectives
  SET current_value = v_current,
      achieved = v_achieved,
      achieved_at = CASE WHEN v_achieved AND NOT achieved THEN now() ELSE achieved_at END
  WHERE id = v_objective.id;

  RETURN jsonb_build_object(
    'updated', true,
    'current_value', v_current,
    'achieved', v_achieved
  );
END;
$$;

-- ============================================================
-- Keurzen — Initial Schema
-- ============================================================

-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
-- Extension de auth.users

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  has_seen_onboarding BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, has_seen_onboarding)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    FALSE
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── HOUSEHOLDS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.households (
  id          UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name        TEXT NOT NULL,
  invite_code TEXT NOT NULL DEFAULT upper(substring(md5(random()::text), 1, 8)),
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT households_invite_code_unique UNIQUE (invite_code)
);

CREATE TABLE IF NOT EXISTS public.household_members (
  id           UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  color        TEXT NOT NULL DEFAULT '#88D4A9',
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT household_members_unique UNIQUE (household_id, user_id)
);

-- ─── INVITATIONS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invitations (
  id           UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  invited_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email        TEXT,
  token        TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT invitations_token_unique UNIQUE (token)
);

-- ─── TASKS ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tasks (
  id                    UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  household_id          UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  description           TEXT,
  assigned_to           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date              DATE,
  category              TEXT NOT NULL DEFAULT 'other',
  zone                  TEXT NOT NULL DEFAULT 'general',
  priority              TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_minutes     INTEGER CHECK (estimated_minutes > 0),
  status                TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'overdue')),
  recurrence            TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly', 'biweekly', 'monthly')),
  recurrence_parent_id  UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  completed_at          TIMESTAMPTZ,
  created_by            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_household_id_idx ON public.tasks(household_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks(status);

-- ─── TIME LOGS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.time_logs (
  id           UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  task_id      UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  minutes      INTEGER NOT NULL CHECK (minutes > 0),
  logged_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS time_logs_household_id_idx ON public.time_logs(household_id);
CREATE INDEX IF NOT EXISTS time_logs_user_id_idx ON public.time_logs(user_id);

-- ─── TLX ENTRIES ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tlx_entries (
  id              UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  household_id    UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  week_start      DATE NOT NULL, -- Lundi de la semaine
  mental_demand   SMALLINT NOT NULL CHECK (mental_demand BETWEEN 0 AND 100),
  physical_demand SMALLINT NOT NULL CHECK (physical_demand BETWEEN 0 AND 100),
  temporal_demand SMALLINT NOT NULL CHECK (temporal_demand BETWEEN 0 AND 100),
  performance     SMALLINT NOT NULL CHECK (performance BETWEEN 0 AND 100),
  effort          SMALLINT NOT NULL CHECK (effort BETWEEN 0 AND 100),
  frustration     SMALLINT NOT NULL CHECK (frustration BETWEEN 0 AND 100),
  score           SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tlx_entries_unique_week UNIQUE (user_id, household_id, week_start)
);

-- ─── WEEKLY STATS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.weekly_stats (
  id                UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  household_id      UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start        DATE NOT NULL,
  tasks_count       INTEGER NOT NULL DEFAULT 0,
  total_tasks_week  INTEGER NOT NULL DEFAULT 0,
  tasks_share       NUMERIC(6,4) NOT NULL DEFAULT 0,
  tasks_delta       NUMERIC(6,4) NOT NULL DEFAULT 0,
  minutes_total     INTEGER NOT NULL DEFAULT 0,
  total_minutes_week INTEGER NOT NULL DEFAULT 0,
  minutes_share     NUMERIC(6,4) NOT NULL DEFAULT 0,
  minutes_delta     NUMERIC(6,4) NOT NULL DEFAULT 0,
  expected_share    NUMERIC(6,4) NOT NULL DEFAULT 0,
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT weekly_stats_unique UNIQUE (household_id, user_id, week_start)
);

-- ─── ALERTS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.alerts (
  id           UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('task_imbalance', 'time_imbalance', 'overload')),
  level        TEXT NOT NULL CHECK (level IN ('balanced', 'watch', 'unbalanced')),
  message      TEXT NOT NULL,
  data         JSONB NOT NULL DEFAULT '{}',
  read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alerts_household_id_idx ON public.alerts(household_id);

-- ─── BUDGET EXPENSES ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.budget_expenses (
  id           UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  paid_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount       INTEGER NOT NULL CHECK (amount > 0), -- en centimes
  category     TEXT NOT NULL DEFAULT 'other',
  memo         TEXT,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS budget_expenses_household_id_idx ON public.budget_expenses(household_id);
CREATE INDEX IF NOT EXISTS budget_expenses_date_idx ON public.budget_expenses(date);

-- ─── BUDGET SPLITS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.budget_splits (
  id           UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  expense_id   UUID REFERENCES public.budget_expenses(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode         TEXT NOT NULL DEFAULT 'equal' CHECK (mode IN ('equal', 'percentage', 'fixed')),
  share        NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── TOUR SLIDES ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tour_slides (
  id        UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  page      TEXT NOT NULL CHECK (page IN ('welcome', 'dashboard', 'household', 'tlx')),
  version   INTEGER NOT NULL DEFAULT 1,
  "order"   SMALLINT NOT NULL DEFAULT 0,
  title     TEXT NOT NULL,
  body      TEXT NOT NULL,
  image_key TEXT,
  CONSTRAINT tour_slides_unique UNIQUE (page, version, "order")
);

CREATE TABLE IF NOT EXISTS public.tour_seen (
  id      UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  page    TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tour_seen_unique UNIQUE (user_id, page, version)
);

-- ─── PUSH TOKENS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id         UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT push_tokens_unique UNIQUE (user_id, token)
);

-- ─── NOTIFICATION PREFERENCES ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id              UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  morning_digest  BOOLEAN NOT NULL DEFAULT TRUE,
  task_reminder   BOOLEAN NOT NULL DEFAULT TRUE,
  overdue_alert   BOOLEAN NOT NULL DEFAULT TRUE,
  imbalance_alert BOOLEAN NOT NULL DEFAULT TRUE,
  digest_hour     SMALLINT NOT NULL DEFAULT 8 CHECK (digest_hour BETWEEN 0 AND 23),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── UPDATED AT TRIGGERS ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_budget_expenses_updated_at
  BEFORE UPDATE ON public.budget_expenses
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

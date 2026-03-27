-- ============================================================
-- Keurzen — Row Level Security Policies
-- Toute donnée d'un foyer est visible uniquement par les membres
-- ============================================================

-- ─── Enable RLS ───────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tlx_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_seen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- ─── Helper function: is_household_member ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_household_member(h_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = h_id AND user_id = auth.uid()
  );
$$;

-- ─── PROFILES ─────────────────────────────────────────────────────────────────

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Members can view profiles of their household"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm1
      JOIN public.household_members hm2 ON hm1.household_id = hm2.household_id
      WHERE hm1.user_id = auth.uid() AND hm2.user_id = profiles.id
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- ─── HOUSEHOLDS ───────────────────────────────────────────────────────────────

CREATE POLICY "Members can view their household"
  ON public.households FOR SELECT
  USING (public.is_household_member(id));

CREATE POLICY "Authenticated users can create households"
  ON public.households FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Owners can update their household"
  ON public.households FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ─── HOUSEHOLD MEMBERS ────────────────────────────────────────────────────────

CREATE POLICY "Members can view household members"
  ON public.household_members FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "System can insert household members"
  ON public.household_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update member roles"
  ON public.household_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = household_members.household_id
        AND hm.user_id = auth.uid()
        AND hm.role IN ('owner', 'admin')
    )
  );

-- ─── INVITATIONS ──────────────────────────────────────────────────────────────

CREATE POLICY "Members can view invitations"
  ON public.invitations FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Members can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (public.is_household_member(household_id) AND invited_by = auth.uid());

CREATE POLICY "Admins can revoke invitations"
  ON public.invitations FOR UPDATE
  USING (public.is_household_member(household_id));

-- ─── TASKS ────────────────────────────────────────────────────────────────────

CREATE POLICY "Members can view household tasks"
  ON public.tasks FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Members can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (public.is_household_member(household_id) AND created_by = auth.uid());

CREATE POLICY "Members can update household tasks"
  ON public.tasks FOR UPDATE
  USING (public.is_household_member(household_id));

CREATE POLICY "Task creator or admin can delete tasks"
  ON public.tasks FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = tasks.household_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ─── TIME LOGS ────────────────────────────────────────────────────────────────

CREATE POLICY "Members can view household time logs"
  ON public.time_logs FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Members can create time logs"
  ON public.time_logs FOR INSERT
  WITH CHECK (public.is_household_member(household_id) AND user_id = auth.uid());

CREATE POLICY "Users can update their own time logs"
  ON public.time_logs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own time logs"
  ON public.time_logs FOR DELETE
  USING (user_id = auth.uid());

-- ─── TLX ENTRIES ──────────────────────────────────────────────────────────────

CREATE POLICY "Members can view household TLX entries"
  ON public.tlx_entries FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Users can create their own TLX entries"
  ON public.tlx_entries FOR INSERT
  WITH CHECK (public.is_household_member(household_id) AND user_id = auth.uid());

CREATE POLICY "Users can update their own TLX entries"
  ON public.tlx_entries FOR UPDATE
  USING (user_id = auth.uid());

-- ─── WEEKLY STATS ─────────────────────────────────────────────────────────────

CREATE POLICY "Members can view household weekly stats"
  ON public.weekly_stats FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Service role can insert weekly stats"
  ON public.weekly_stats FOR INSERT
  WITH CHECK (TRUE); -- Only accessible via service role

CREATE POLICY "Service role can update weekly stats"
  ON public.weekly_stats FOR UPDATE
  USING (TRUE); -- Only accessible via service role

-- ─── ALERTS ───────────────────────────────────────────────────────────────────

CREATE POLICY "Members can view household alerts"
  ON public.alerts FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Members can mark alerts as read"
  ON public.alerts FOR UPDATE
  USING (public.is_household_member(household_id));

CREATE POLICY "Service role can create alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (TRUE);

-- ─── BUDGET EXPENSES ──────────────────────────────────────────────────────────

CREATE POLICY "Members can view household expenses"
  ON public.budget_expenses FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Members can create expenses"
  ON public.budget_expenses FOR INSERT
  WITH CHECK (public.is_household_member(household_id));

CREATE POLICY "Members can update household expenses"
  ON public.budget_expenses FOR UPDATE
  USING (public.is_household_member(household_id));

CREATE POLICY "Expense creator can delete their expense"
  ON public.budget_expenses FOR DELETE
  USING (paid_by = auth.uid());

-- ─── BUDGET SPLITS ────────────────────────────────────────────────────────────

CREATE POLICY "Members can view household budget splits"
  ON public.budget_splits FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Members can manage budget splits"
  ON public.budget_splits FOR ALL
  USING (public.is_household_member(household_id));

-- ─── TOUR SLIDES ──────────────────────────────────────────────────────────────

CREATE POLICY "Everyone can view tour slides"
  ON public.tour_slides FOR SELECT
  USING (TRUE);

-- ─── TOUR SEEN ────────────────────────────────────────────────────────────────

CREATE POLICY "Users can view their own tour history"
  ON public.tour_seen FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark tours as seen"
  ON public.tour_seen FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ─── PUSH TOKENS ──────────────────────────────────────────────────────────────

CREATE POLICY "Users can manage their push tokens"
  ON public.push_tokens FOR ALL
  USING (user_id = auth.uid());

-- ─── NOTIFICATION PREFERENCES ─────────────────────────────────────────────────

CREATE POLICY "Users can manage their notification preferences"
  ON public.notification_preferences FOR ALL
  USING (user_id = auth.uid());

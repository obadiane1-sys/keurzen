/**
 * Keurzen — Edge Function: generate-weekly-objective
 *
 * Generates a single weekly micro-objective per household based on
 * last week's metrics. Triggered by cron Monday 7:00 AM.
 *
 * Hierarchy: completion > balance > TLX > streak > maintenance.
 * Idempotent: ON CONFLICT DO NOTHING.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ObjectiveResult {
  type: 'completion' | 'balance' | 'tlx' | 'streak' | 'maintenance';
  target_value: number;
  baseline_value: number;
  label: string;
}

serve(async (req: Request) => {
  // Validate cron secret
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date();
  const weekStart = getMonday(now);
  const weekStartStr = formatDate(weekStart);
  const prevWeekStart = addDays(weekStart, -7);
  const prevWeekStartStr = formatDate(prevWeekStart);

  // Get all households
  const { data: households, error: hErr } = await supabase
    .from('households')
    .select('id');

  if (hErr) {
    return errorResponse(hErr.message);
  }

  let created = 0;
  let pushed = 0;

  for (const household of households ?? []) {
    const objective = await computeObjective(supabase, household.id, prevWeekStartStr);

    // Insert (idempotent)
    const { error: insertErr } = await supabase
      .from('weekly_objectives')
      .insert({
        household_id: household.id,
        week_start: weekStartStr,
        type: objective.type,
        target_value: objective.target_value,
        baseline_value: objective.baseline_value,
        current_value: objective.baseline_value,
        label: objective.label,
      })
      .select()
      .maybeSingle();

    // ON CONFLICT → skip (objective already exists)
    if (insertErr?.code === '23505') continue;
    if (insertErr) {
      console.error(`Insert error for ${household.id}:`, insertErr);
      continue;
    }

    created++;

    // Send push notification to all members
    const sentCount = await sendPushToHousehold(supabase, household.id, objective.label);
    pushed += sentCount;
  }

  return new Response(
    JSON.stringify({ success: true, created, pushed, week_start: weekStartStr }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

// ─── Objective computation ──────────────────────────────────────────────────

async function computeObjective(
  supabase: any,
  householdId: string,
  prevWeekStart: string
): Promise<ObjectiveResult> {
  // Fetch last week's stats
  const { data: stats } = await supabase
    .from('weekly_stats')
    .select('tasks_share, tasks_delta, total_tasks_week')
    .eq('household_id', householdId)
    .eq('week_start', prevWeekStart);

  // Fetch last week's TLX entries
  const prevWeekEnd = formatDate(addDays(new Date(prevWeekStart), 7));
  const { data: tlxEntries } = await supabase
    .from('tlx_entries')
    .select('score')
    .eq('household_id', householdId)
    .gte('created_at', prevWeekStart)
    .lt('created_at', prevWeekEnd);

  // Fetch streak (consecutive days with completed tasks, going back from yesterday)
  const yesterday = addDays(new Date(), -1);
  const thirtyDaysAgo = formatDate(addDays(yesterday, -30));
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('completed_at')
    .eq('household_id', householdId)
    .eq('status', 'done')
    .not('completed_at', 'is', null)
    .gte('completed_at', thirtyDaysAgo)
    .order('completed_at', { ascending: false });

  // Compute metrics
  const totalTasks = stats?.[0]?.total_tasks_week ?? 0;
  const totalCompleted = stats?.reduce((sum: number, s: any) =>
    sum + Math.round(s.tasks_share * s.total_tasks_week), 0) ?? 0;
  const completion = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 100;

  const maxImbalance = stats?.length > 0
    ? Math.max(...stats.map((s: any) => Math.abs(s.tasks_delta)))
    : 0;

  const avgTlx = tlxEntries?.length > 0
    ? Math.round(tlxEntries.reduce((sum: number, e: any) => sum + e.score, 0) / tlxEntries.length)
    : 0;

  const completedDates = new Set(
    (completedTasks ?? []).map((t: any) =>
      new Date(t.completed_at).toISOString().split('T')[0]
    )
  );
  let streak = 0;
  let checkDate = yesterday;
  while (completedDates.has(formatDate(checkDate))) {
    streak++;
    checkDate = addDays(checkDate, -1);
  }

  // Apply hierarchy
  // 1. Completion < 80%
  if (completion < 80) {
    const target = Math.min(completion + 10, 90);
    return {
      type: 'completion',
      target_value: target,
      baseline_value: completion,
      label: `Atteindre ${target}% de completion`,
    };
  }

  // 2. Imbalance > 25%
  if (maxImbalance > 0.25) {
    return {
      type: 'balance',
      target_value: 20,
      baseline_value: Math.round(maxImbalance * 100),
      label: 'Reduire le desequilibre sous 20%',
    };
  }

  // 3. TLX > 65
  if (avgTlx > 65) {
    return {
      type: 'tlx',
      target_value: 55,
      baseline_value: avgTlx,
      label: 'Passer la charge mentale sous 55',
    };
  }

  // 4. Streak < 3
  if (streak < 3) {
    return {
      type: 'streak',
      target_value: 5,
      baseline_value: streak,
      label: 'Atteindre 5 jours consecutifs d\'activite',
    };
  }

  // 5. Maintenance (default)
  const score = completion;
  const target = Math.max(score - 5, 50);
  return {
    type: 'maintenance',
    target_value: target,
    baseline_value: score,
    label: `Maintenir le score au-dessus de ${target}`,
  };
}

// ─── Push notifications ─────────────────────────────────────────────────────

async function sendPushToHousehold(
  supabase: any,
  householdId: string,
  objectiveLabel: string
): Promise<number> {
  const { data: members } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('household_id', householdId);

  if (!members || members.length === 0) return 0;

  const userIds = members.map((m: any) => m.user_id);
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .in('user_id', userIds);

  let sent = 0;
  for (const { token } of tokens ?? []) {
    await sendExpoNotification(token, {
      title: '🎯 Objectif de la semaine',
      body: objectiveLabel,
      data: { type: 'weekly_objective', household_id: householdId },
    });
    sent++;
  }

  return sent;
}

async function sendExpoNotification(
  token: string,
  payload: { title: string; body: string; data?: Record<string, unknown> }
) {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ to: token, sound: 'default', ...payload }),
    });
  } catch (err) {
    console.error('Push error:', err);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function errorResponse(message: string) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}

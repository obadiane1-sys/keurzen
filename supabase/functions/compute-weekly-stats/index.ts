/**
 * Keurzen — Edge Function: compute-weekly-stats
 *
 * Calcule les stats hebdomadaires pour tous les foyers.
 * Déclenché par un cron Supabase chaque lundi à 6h.
 *
 * Logique :
 * - Pour chaque foyer actif
 *   - Pour chaque membre
 *     - Compter les tâches terminées la semaine passée
 *     - Compter les minutes loggées
 *     - Calculer la part réelle vs attendue
 *     - Créer/mettre à jour la weekly_stat
 *     - Créer une alerte si déséquilibre
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const IMBALANCE_THRESHOLD = 0.20;
const MIN_TASKS_SAMPLE = 8;
const MIN_MINUTES_SAMPLE = 60;

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Compute last week's range
    const now = new Date();
    const weekStart = getMonday(now);
    const weekStartStr = formatDate(weekStart);

    console.log(`Computing weekly stats for week starting ${weekStartStr}`);

    // Get all households
    const { data: households, error: hErr } = await supabase
      .from('households')
      .select('id');

    if (hErr) throw hErr;

    let processed = 0;

    for (const household of households ?? []) {
      await computeForHousehold(supabase, household.id, weekStartStr);
      processed++;
    }

    return new Response(
      JSON.stringify({ success: true, processed, week_start: weekStartStr }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('compute-weekly-stats error:', err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function computeForHousehold(supabase: any, householdId: string, weekStart: string) {
  // Get members
  const { data: members } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('household_id', householdId);

  if (!members || members.length === 0) return;

  const nbMembers = members.length;
  const expectedShare = 1 / nbMembers;

  const weekEnd = addDays(new Date(weekStart), 7);
  const weekEndStr = formatDate(weekEnd);

  // Total tasks completed this week in this household
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('id, assigned_to')
    .eq('household_id', householdId)
    .eq('status', 'done')
    .gte('completed_at', weekStart)
    .lt('completed_at', weekEndStr);

  const totalTasks = allTasks?.length ?? 0;

  // Total minutes this week
  const { data: allLogs } = await supabase
    .from('time_logs')
    .select('user_id, minutes')
    .eq('household_id', householdId)
    .gte('logged_at', weekStart)
    .lt('logged_at', weekEndStr);

  const totalMinutes = (allLogs ?? []).reduce((sum: number, l: any) => sum + l.minutes, 0);

  // Per member
  for (const member of members) {
    const userId = member.user_id;

    const memberTasks = (allTasks ?? []).filter((t: any) => t.assigned_to === userId);
    const memberMinutes = (allLogs ?? [])
      .filter((l: any) => l.user_id === userId)
      .reduce((sum: number, l: any) => sum + l.minutes, 0);

    const tasksShare = totalTasks > 0 ? memberTasks.length / totalTasks : 0;
    const minutesShare = totalMinutes > 0 ? memberMinutes / totalMinutes : 0;
    const tasksDelta = tasksShare - expectedShare;
    const minutesDelta = minutesShare - expectedShare;

    // Upsert weekly stat
    await supabase.from('weekly_stats').upsert(
      {
        household_id: householdId,
        user_id: userId,
        week_start: weekStart,
        tasks_count: memberTasks.length,
        total_tasks_week: totalTasks,
        tasks_share: tasksShare,
        tasks_delta: tasksDelta,
        minutes_total: memberMinutes,
        total_minutes_week: totalMinutes,
        minutes_share: minutesShare,
        minutes_delta: minutesDelta,
        expected_share: expectedShare,
        computed_at: new Date().toISOString(),
      },
      { onConflict: 'household_id,user_id,week_start' }
    );

    // Check imbalance alerts
    if (
      totalTasks >= MIN_TASKS_SAMPLE &&
      totalMinutes >= MIN_MINUTES_SAMPLE &&
      (Math.abs(tasksDelta) >= IMBALANCE_THRESHOLD || Math.abs(minutesDelta) >= IMBALANCE_THRESHOLD)
    ) {
      const level =
        Math.abs(tasksDelta) >= IMBALANCE_THRESHOLD * 1.5
          ? 'unbalanced'
          : 'watch';

      const isOverloaded = tasksDelta > 0 && minutesDelta > 0;

      // Upsert pour éviter les doublons si le cron tourne plusieurs fois dans la même semaine.
      // La contrainte UNIQUE (household_id, user_id, type, week_start) garantit l'idempotence.
      await supabase.from('alerts').upsert(
        {
          household_id: householdId,
          user_id: userId,
          type: isOverloaded ? 'task_imbalance' : 'time_imbalance',
          level,
          week_start: weekStart,
          message: isOverloaded
            ? `Ce membre effectue ${Math.round(tasksShare * 100)}% des tâches (attendu ${Math.round(expectedShare * 100)}%)`
            : `Ce membre enregistre ${Math.round(minutesShare * 100)}% du temps (attendu ${Math.round(expectedShare * 100)}%)`,
          data: { tasks_share: tasksShare, minutes_share: minutesShare, expected_share: expectedShare },
          read: false,
        },
        { onConflict: 'household_id,user_id,type,week_start' }
      );
    }
  }
}

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

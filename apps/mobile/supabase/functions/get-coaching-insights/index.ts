/**
 * Keurzen — Edge Function: get-coaching-insights
 *
 * Moteur de règles déterministe qui génère des insights de coaching
 * personnalisés pour le foyer de l'utilisateur authentifié.
 *
 * Règles appliquées (par priorité) :
 * 1. TLX Delta Alert   — si un membre a +10% de charge vs semaine précédente
 * 2. Task Imbalance    — si l'écart de répartition des tâches dépasse 20pp
 * 3. Task Completion   — si un membre a complété >=5 tâches aujourd'hui
 * 4. Planning Reminder — si dimanche/lundi et aucune tâche planifiée
 * 5. Fallback          — aucun insight déclenché → "Tout va bien"
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Types ────────────────────────────────────────────────────────────────────

type InsightType = 'alert' | 'conseil' | 'wellbeing';

interface CoachingInsight {
  id: string;
  type: InsightType;
  icon: string;
  label: string;
  message: string;
  cta_label: string;
  priority: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TLX_DELTA_THRESHOLD = 10; // % increase in TLX score week-over-week
const TASK_IMBALANCE_THRESHOLD = 20; // percentage points gap in task distribution
const MIN_TASKS_FOR_COMPLETION_PRAISE = 5; // tasks completed today

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Handler ─────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Auth: extract bearer token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Get household_id for the user
    const { data: membership, error: memberError } = await supabase
      .from('household_members')
      .select('household_id, profiles(full_name)')
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || !membership) {
      return new Response(JSON.stringify({ error: 'No household found for user' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const householdId = membership.household_id;

    // Run rules engine
    const insights = await computeInsights(supabase, householdId, user.id);

    return new Response(JSON.stringify(insights), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('get-coaching-insights error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});

// ─── Rules Engine ─────────────────────────────────────────────────────────────

async function computeInsights(
  supabase: any,
  householdId: string,
  _currentUserId: string,
): Promise<CoachingInsight[]> {
  const insights: CoachingInsight[] = [];
  const now = new Date();
  const todayStr = formatDate(now);
  const currentWeekStart = getMonday(now);
  const prevWeekStart = getMonday(new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000));
  const currentWeekStartStr = formatDate(currentWeekStart);
  const prevWeekStartStr = formatDate(prevWeekStart);

  // Get all members in the household
  const { data: members } = await supabase
    .from('household_members')
    .select('user_id, profiles(full_name)')
    .eq('household_id', householdId);

  if (!members || members.length === 0) {
    return [buildFallback()];
  }

  const memberIds: string[] = members.map((m: any) => m.user_id);

  // ── Rule 1: TLX Delta Alert ────────────────────────────────────────────────
  const { data: tlxEntries } = await supabase
    .from('tlx_entries')
    .select('user_id, score, week_start')
    .eq('household_id', householdId)
    .in('week_start', [currentWeekStartStr, prevWeekStartStr])
    .in('user_id', memberIds);

  if (tlxEntries && tlxEntries.length > 0) {
    for (const member of members) {
      const userId = member.user_id;
      const firstName = getFirstName(member.profiles?.full_name);

      const current = tlxEntries.find(
        (e: any) => e.user_id === userId && e.week_start === currentWeekStartStr,
      );
      const previous = tlxEntries.find(
        (e: any) => e.user_id === userId && e.week_start === prevWeekStartStr,
      );

      if (current && previous && previous.score > 0) {
        const deltaPercent = ((current.score - previous.score) / previous.score) * 100;
        if (deltaPercent > TLX_DELTA_THRESHOLD) {
          insights.push({
            id: `tlx-alert-${userId}`,
            type: 'alert',
            icon: 'warning-outline',
            label: 'Charge mentale en hausse',
            message: `${firstName} ressent une charge mentale plus élevée cette semaine (+${Math.round(deltaPercent)}%). Prenez soin de vous.`,
            cta_label: 'Voir le TLX',
            priority: 1,
          });
        }
      }
    }
  }

  // ── Rule 2: Task Imbalance ─────────────────────────────────────────────────
  const { data: weeklyStats } = await supabase
    .from('weekly_stats')
    .select('user_id, tasks_share')
    .eq('household_id', householdId)
    .eq('week_start', currentWeekStartStr)
    .in('user_id', memberIds);

  if (weeklyStats && weeklyStats.length >= 2) {
    const shares: number[] = weeklyStats.map((s: any) => s.tasks_share);
    const maxShare = Math.max(...shares);
    const minShare = Math.min(...shares);
    const gapPercent = (maxShare - minShare) * 100;

    if (gapPercent > TASK_IMBALANCE_THRESHOLD) {
      const overloadedStat = weeklyStats.find((s: any) => s.tasks_share === maxShare);
      const overloadedMember = members.find((m: any) => m.user_id === overloadedStat?.user_id);
      const overloadedName = getFirstName(overloadedMember?.profiles?.full_name);

      insights.push({
        id: `task-imbalance-${currentWeekStartStr}`,
        type: 'conseil',
        icon: 'chatbubble-outline',
        label: 'Déséquilibre des tâches',
        message: `${overloadedName} prend en charge ${Math.round(maxShare * 100)}% des tâches cette semaine. Rééquilibrez ensemble.`,
        cta_label: 'Voir les tâches',
        priority: 2,
      });
    }
  }

  // ── Rule 3: Task Completion Praise ────────────────────────────────────────
  const tomorrowStr = formatDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  const { data: completedToday } = await supabase
    .from('tasks')
    .select('id, assigned_to')
    .eq('household_id', householdId)
    .eq('status', 'done')
    .gte('completed_at', todayStr)
    .lt('completed_at', tomorrowStr)
    .in('assigned_to', memberIds);

  if (completedToday && completedToday.length > 0) {
    // Count per member
    const countByMember: Record<string, number> = {};
    for (const task of completedToday) {
      if (task.assigned_to) {
        countByMember[task.assigned_to] = (countByMember[task.assigned_to] ?? 0) + 1;
      }
    }

    for (const [userId, count] of Object.entries(countByMember)) {
      if (count >= MIN_TASKS_FOR_COMPLETION_PRAISE) {
        const member = members.find((m: any) => m.user_id === userId);
        const firstName = getFirstName(member?.profiles?.full_name);

        insights.push({
          id: `completion-praise-${userId}-${todayStr}`,
          type: 'wellbeing',
          icon: 'heart-outline',
          label: 'Bravo aujourd\'hui !',
          message: `${firstName} a complété ${count} tâches aujourd'hui. Excellent élan !`,
          cta_label: 'Voir les tâches',
          priority: 3,
        });
      }
    }
  }

  // ── Rule 4: Planning Reminder (Sunday=0, Monday=1) ────────────────────────
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 1) {
    const nextWeekStart = formatDate(
      new Date(currentWeekStart.getTime() + (dayOfWeek === 0 ? 1 : 0) * 24 * 60 * 60 * 1000),
    );
    const nextWeekEnd = formatDate(
      new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
    );

    const { data: plannedTasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('household_id', householdId)
      .neq('status', 'done')
      .gte('due_date', nextWeekStart)
      .lt('due_date', nextWeekEnd)
      .limit(1);

    if (!plannedTasks || plannedTasks.length === 0) {
      insights.push({
        id: `planning-reminder-${currentWeekStartStr}`,
        type: 'conseil',
        icon: 'chatbubble-outline',
        label: 'Planifiez la semaine',
        message: 'Aucune tâche planifiée pour la semaine à venir. Prenez 5 minutes pour organiser le foyer.',
        cta_label: 'Créer une tâche',
        priority: 4,
      });
    }
  }

  // ── Rule 5: Fallback ──────────────────────────────────────────────────────
  if (insights.length === 0) {
    return [buildFallback()];
  }

  // Sort by priority ascending (lower number = higher priority)
  insights.sort((a, b) => a.priority - b.priority);

  return insights;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildFallback(): CoachingInsight {
  return {
    id: 'fallback-all-good',
    type: 'conseil',
    icon: 'chatbubble-outline',
    label: 'Tout va bien',
    message: 'Le foyer est équilibré. Continuez comme ça !',
    cta_label: 'Voir le tableau de bord',
    priority: 99,
  };
}

function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return 'Un membre';
  return fullName.split(' ')[0] ?? fullName;
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

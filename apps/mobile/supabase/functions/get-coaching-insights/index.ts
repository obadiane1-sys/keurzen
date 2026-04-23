/**
 * Keurzen — Edge Function: get-coaching-insights
 *
 * Deterministic rules engine that produces coaching insight cards
 * for the dashboard. No LLM. Reads TLX, tasks, and weekly stats
 * to generate contextual advice.
 *
 * Called by authenticated users. Derives household from auth.uid().
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface CoachingInsight {
  id: string;
  type: 'alert' | 'conseil' | 'wellbeing';
  icon: string;
  label: string;
  message: string;
  cta_label: string;
  priority: number;
}

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Authenticate user
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing auth' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get user's household
    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const householdId = member.household_id;
    const insights: CoachingInsight[] = [];

    // Current week start (Monday)
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.toISOString().split('T')[0];

    // Previous week start
    const prevMonday = new Date(monday);
    prevMonday.setDate(monday.getDate() - 7);
    const prevWeekStart = prevMonday.toISOString().split('T')[0];

    // Get household members (names for personalized messages)
    const { data: members } = await supabase
      .from('household_members')
      .select('user_id, profiles(full_name)')
      .eq('household_id', householdId);

    const memberNames: Record<string, string> = {};
    for (const m of members ?? []) {
      const profile = m.profiles as { full_name: string | null } | null;
      memberNames[m.user_id] = profile?.full_name?.split(' ')[0] ?? 'Membre';
    }

    // ── Rule 1: TLX Delta Alert ──
    const { data: currentTlx } = await supabase
      .from('tlx_entries')
      .select('user_id, score')
      .eq('household_id', householdId)
      .eq('week_start', weekStart);

    const { data: prevTlx } = await supabase
      .from('tlx_entries')
      .select('user_id, score')
      .eq('household_id', householdId)
      .eq('week_start', prevWeekStart);

    if (currentTlx && prevTlx) {
      for (const entry of currentTlx) {
        const prev = prevTlx.find((p) => p.user_id === entry.user_id);
        if (prev && prev.score > 0) {
          const deltaPct = Math.round(((entry.score - prev.score) / prev.score) * 100);
          if (deltaPct > 10) {
            const name = memberNames[entry.user_id] ?? 'Un membre';
            insights.push({
              id: `tlx-delta-${entry.user_id}`,
              type: 'alert',
              icon: 'warning-outline',
              label: `Attention ${name} !`,
              message: `La charge mentale de ${name} semble augmenter cette semaine (+${deltaPct}%).`,
              cta_label: 'Pense a deleguer',
              priority: 1,
            });
          }
        }
      }
    }

    // ── Rule 2: Task Imbalance ──
    const { data: weeklyStats } = await supabase
      .from('weekly_stats')
      .select('user_id, tasks_share')
      .eq('household_id', householdId)
      .eq('week_start', weekStart);

    if (weeklyStats && weeklyStats.length >= 2) {
      const shares = weeklyStats.map((s) => s.tasks_share);
      const maxShare = Math.max(...shares);
      const minShare = Math.min(...shares);
      if (maxShare - minShare > 0.2) {
        insights.push({
          id: 'task-imbalance',
          type: 'conseil',
          icon: 'chatbubble-outline',
          label: 'Conseil',
          message: 'La repartition des taches est desequilibree. Pensez a deleguer.',
          cta_label: 'Voir la repartition',
          priority: 2,
        });
      }
    }

    // ── Rule 3: Task Completion Praise ──
    const todayStr = now.toISOString().split('T')[0];
    const { data: todayDone } = await supabase
      .from('tasks')
      .select('assigned_to')
      .eq('household_id', householdId)
      .eq('status', 'done')
      .gte('completed_at', `${todayStr}T00:00:00`)
      .lte('completed_at', `${todayStr}T23:59:59`);

    if (todayDone) {
      const counts: Record<string, number> = {};
      for (const t of todayDone) {
        if (t.assigned_to) {
          counts[t.assigned_to] = (counts[t.assigned_to] || 0) + 1;
        }
      }
      for (const [userId, count] of Object.entries(counts)) {
        if (count >= 5) {
          const name = memberNames[userId] ?? 'Un membre';
          insights.push({
            id: `praise-${userId}`,
            type: 'wellbeing',
            icon: 'heart-outline',
            label: 'Bien-etre',
            message: `${name} a complete ${count} taches aujourd'hui. Remerciez-le !`,
            cta_label: 'Envoyer un mot doux',
            priority: 3,
          });
        }
      }
    }

    // ── Rule 4: Planning Reminder (Sunday=0 or Monday=1) ──
    if (day === 0 || day === 1) {
      const { data: plannedTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('household_id', householdId)
        .neq('status', 'done')
        .gte('due_date', weekStart)
        .limit(1);

      if (!plannedTasks || plannedTasks.length === 0) {
        insights.push({
          id: 'planning-reminder',
          type: 'conseil',
          icon: 'chatbubble-outline',
          label: 'Conseil',
          message: 'Prenez 15 minutes pour planifier la semaine ensemble.',
          cta_label: 'Planifier',
          priority: 2,
        });
      }
    }

    // ── Rule 5: Fallback ──
    if (insights.length === 0) {
      insights.push({
        id: 'all-good',
        type: 'conseil',
        icon: 'chatbubble-outline',
        label: 'Conseil',
        message: 'Tout va bien ! Continuez sur cette voie.',
        cta_label: 'Voir le tableau de bord',
        priority: 10,
      });
    }

    // Sort by priority (lower first)
    insights.sort((a, b) => a.priority - b.priority);

    return new Response(JSON.stringify(insights), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('get-coaching-insights error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

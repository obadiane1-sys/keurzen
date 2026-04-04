/**
 * Keurzen — Edge Function: generate-weekly-report
 *
 * Collects weekly analytics data for a household, sends to Claude Haiku,
 * and upserts the structured report into weekly_reports.
 *
 * Called by:
 * - Cron (Monday 6:05 AM) for all households
 * - Client on-demand via "Regenerate" button
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const CLAUDE_MAX_TOKENS = 1024;
const CLAUDE_TIMEOUT = 15_000;
const MIN_TASKS_FOR_REPORT = 3;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Tu es le coach bien-être du foyer Keurzen. Ton ton est calme, bienveillant, factuel et encourageant. Jamais culpabilisant. Tu tutoies les membres.
Tu analyses les données d'une semaine et produis un rapport structuré en JSON.

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans commentaires, sans backticks.

Structure attendue :
{
  "summary": "2-3 phrases de bilan global de la semaine",
  "attention_points": [
    { "icon": "alert-circle", "text": "...", "level": "warning ou info" }
  ],
  "insights": [
    { "text": "...", "category": "imbalance ou workload ou pattern ou improvement" }
  ],
  "orientations": [
    { "text": "...", "priority": "high ou medium" }
  ]
}

Règles :
- Maximum 3 attention_points, 3 insights, 3 orientations
- Les orientations sont des suggestions concrètes et actionnables
- Ne jamais pointer un membre du doigt négativement
- Utiliser les prénoms des membres
- Si les données sont insuffisantes, le dire dans le summary et réduire les sections
- Icônes valides pour attention_points : alert-circle, information-circle, warning-outline, time-outline, people-outline`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse request
    const { household_id } = await req.json();
    if (!household_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'household_id required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Verify auth — always required
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');

    // Allow cron calls with service_role key or CRON_SECRET header
    const isCronCall = authHeader?.includes(serviceRoleKey) ||
      (cronSecret && req.headers.get('x-cron-secret') === cronSecret);

    if (!isCronCall) {
      // Client call — verify JWT + household membership
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: 'Non authentifié' }),
          { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Non authentifié' }),
          { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }
      const { data: membership } = await supabase
        .from('household_members')
        .select('user_id')
        .eq('household_id', household_id)
        .eq('user_id', user.id)
        .single();
      if (!membership) {
        return new Response(
          JSON.stringify({ success: false, error: 'Non membre du foyer' }),
          { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ─── Compute week range ───────────────────────────────────────────────
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day === 0 ? 7 : day) - 1));
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.toISOString().split('T')[0];
    const weekEnd = new Date(monday);
    weekEnd.setDate(monday.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // ─── Collect data (parallel) ─────────────────────────────────────────

    const [
      { data: members },
      { data: weeklyStats },
      { data: tlxEntries },
      { data: completedTasks },
      { data: timeLogs },
      { data: alerts },
    ] = await Promise.all([
      supabase.from('household_members').select('user_id, role, profile:profiles(full_name)').eq('household_id', household_id),
      supabase.from('weekly_stats').select('*').eq('household_id', household_id).eq('week_start', weekStart),
      supabase.from('tlx_entries').select('*').eq('household_id', household_id).eq('week_start', weekStart),
      supabase.from('tasks').select('id, title, category, zone, priority, assigned_to, estimated_minutes, completed_at').eq('household_id', household_id).eq('status', 'done').gte('completed_at', weekStart).lt('completed_at', weekEndStr),
      supabase.from('time_logs').select('user_id, minutes, note').eq('household_id', household_id).gte('logged_at', weekStart).lt('logged_at', weekEndStr),
      supabase.from('alerts').select('type, level, message, data').eq('household_id', household_id).eq('week_start', weekStart),
    ]);

    const memberNames: Record<string, string> = {};
    for (const m of members ?? []) {
      const name = (m.profile as any)?.full_name ?? 'Membre';
      memberNames[m.user_id] = name.split(' ')[0];
    }

    // ─── Check data sufficiency ───────────────────────────────────────────

    const totalCompleted = completedTasks?.length ?? 0;
    const hasTlx = (tlxEntries?.length ?? 0) > 0;

    if (totalCompleted < MIN_TASKS_FOR_REPORT && !hasTlx) {
      return new Response(
        JSON.stringify({ success: false, error: 'insufficient_data' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Build prompt data ────────────────────────────────────────────────

    const promptData = {
      week_start: weekStart,
      members: Object.entries(memberNames).map(([id, name]) => ({ id, name })),
      weekly_stats: (weeklyStats ?? []).map((s: any) => ({
        member: memberNames[s.user_id] ?? 'Inconnu',
        tasks_count: s.tasks_count,
        tasks_share: Math.round(s.tasks_share * 100),
        tasks_delta: Math.round(s.tasks_delta * 100),
        minutes_total: s.minutes_total,
        minutes_share: Math.round(s.minutes_share * 100),
        minutes_delta: Math.round(s.minutes_delta * 100),
        expected_share: Math.round(s.expected_share * 100),
      })),
      tlx_scores: (tlxEntries ?? []).map((t: any) => ({
        member: memberNames[t.user_id] ?? 'Inconnu',
        score: t.score,
        mental_demand: t.mental_demand,
        physical_demand: t.physical_demand,
        frustration: t.frustration,
        effort: t.effort,
      })),
      tasks_summary: {
        total_completed: totalCompleted,
        by_category: groupBy(completedTasks ?? [], 'category'),
        by_priority: groupBy(completedTasks ?? [], 'priority'),
      },
      time_logs_summary: {
        total_minutes: (timeLogs ?? []).reduce((s: number, l: any) => s + l.minutes, 0),
        by_member: Object.fromEntries(
          Object.entries(
            (timeLogs ?? []).reduce((acc: Record<string, number>, l: any) => {
              const name = memberNames[l.user_id] ?? 'Inconnu';
              acc[name] = (acc[name] ?? 0) + l.minutes;
              return acc;
            }, {})
          )
        ),
      },
      alerts: (alerts ?? []).map((a: any) => ({
        type: a.type,
        level: a.level,
        message: a.message,
      })),
    };

    // ─── Call Claude Haiku ────────────────────────────────────────────────

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT);

    let aiResponse: any;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: CLAUDE_MAX_TOKENS,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Voici les données de la semaine du ${weekStart} pour ce foyer :\n\n${JSON.stringify(promptData, null, 2)}`,
            },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Anthropic API ${res.status}: ${errBody}`);
      }

      aiResponse = await res.json();
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('Claude API timeout after ' + CLAUDE_TIMEOUT + 'ms');
      }
      throw err;
    }

    // ─── Parse AI response ────────────────────────────────────────────────

    const content = aiResponse.content?.[0]?.text ?? '';
    let report: any;
    try {
      report = JSON.parse(content);
    } catch {
      // Retry: try extracting JSON from potential markdown wrapping
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          report = JSON.parse(match[0]);
        } catch {
          throw new Error('Invalid JSON fragment from Claude: ' + match[0].substring(0, 200));
        }
      } else {
        throw new Error('No JSON found in Claude response: ' + content.substring(0, 200));
      }
    }

    // Validate structure
    const summary = typeof report.summary === 'string' ? report.summary : 'Rapport généré avec succès.';
    const attention_points = Array.isArray(report.attention_points) ? report.attention_points.slice(0, 3) : [];
    const insights = Array.isArray(report.insights) ? report.insights.slice(0, 3) : [];
    const orientations = Array.isArray(report.orientations) ? report.orientations.slice(0, 3) : [];

    // ─── Upsert report ────────────────────────────────────────────────────

    const { data: upserted, error: upsertErr } = await supabase
      .from('weekly_reports')
      .upsert(
        {
          household_id,
          week_start: weekStart,
          summary,
          attention_points,
          insights,
          orientations,
          model: CLAUDE_MODEL,
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'household_id,week_start' }
      )
      .select('id')
      .single();

    if (upsertErr) throw upsertErr;

    return new Response(
      JSON.stringify({ success: true, report_id: upserted.id }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('generate-weekly-report error:', err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function groupBy(items: any[], key: string): Record<string, number> {
  return items.reduce((acc, item) => {
    const val = item[key] ?? 'unknown';
    acc[val] = (acc[val] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

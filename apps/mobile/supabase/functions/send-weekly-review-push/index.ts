/**
 * Keurzen — Edge Function: send-weekly-review-push
 *
 * Sends a push notification to all household members when
 * the weekly review is ready. Triggered by cron Monday 8:00 AM.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

  // Compute current week start (Monday)
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day === 0 ? 7 : day) - 1));
  monday.setHours(0, 0, 0, 0);
  const weekStart = monday.toISOString().split('T')[0];

  // Get all reports generated this week with balance_score
  const { data: reports } = await supabase
    .from('weekly_reports')
    .select('household_id, balance_score')
    .eq('week_start', weekStart)
    .not('balance_score', 'is', null);

  let sent = 0;

  for (const report of reports ?? []) {
    // Get push tokens for all household members
    const { data: members } = await supabase
      .from('household_members')
      .select('user_id')
      .eq('household_id', report.household_id);

    if (!members || members.length === 0) continue;

    const userIds = members.map((m: any) => m.user_id);
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds);

    const score = Math.round(report.balance_score ?? 0);
    const emoji = score >= 75 ? '🌟' : score >= 50 ? '📊' : '💪';

    for (const { token } of tokens ?? []) {
      await sendExpoNotification(token, {
        title: `${emoji} Bilan de la semaine disponible`,
        body: `Score d'équilibre : ${score}/100. Découvrez le bilan complet de votre foyer.`,
        data: {
          type: 'weekly_review',
          week_start: weekStart,
          household_id: report.household_id,
        },
      });
      sent++;
    }
  }

  return new Response(
    JSON.stringify({ success: true, notifications_sent: sent }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

async function sendExpoNotification(
  token: string,
  payload: { title: string; body: string; data?: Record<string, unknown> }
) {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        ...payload,
      }),
    });
    return await response.json();
  } catch (err) {
    console.error('Push error:', err);
  }
}

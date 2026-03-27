/**
 * Keurzen — Edge Function: morning-digest
 *
 * Envoie un digest matinal avec les tâches du jour
 * pour chaque utilisateur ayant activé cette préférence.
 *
 * Déclenché chaque jour à l'heure configurée (cron).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const today = new Date().toISOString().split('T')[0];

  // Get users with morning digest enabled
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('user_id')
    .eq('morning_digest', true);

  let sent = 0;

  for (const pref of prefs ?? []) {
    // Get their today's tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('assigned_to', pref.user_id)
      .eq('due_date', today)
      .neq('status', 'done')
      .limit(10);

    if (!tasks || tasks.length === 0) continue;

    const taskList = tasks.slice(0, 3).map((t: any) => `• ${t.title}`).join('\n');
    const remaining = tasks.length > 3 ? ` et ${tasks.length - 3} autre(s)` : '';

    // Get push tokens
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', pref.user_id);

    for (const { token } of tokens ?? []) {
      await sendExpoNotification(token, {
        title: `🌅 ${tasks.length} tâche${tasks.length > 1 ? 's' : ''} aujourd'hui`,
        body: taskList + remaining,
        data: { type: 'morning_digest', date: today },
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

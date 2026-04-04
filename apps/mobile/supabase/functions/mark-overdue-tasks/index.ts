/**
 * Keurzen — Edge Function: mark-overdue-tasks
 *
 * Marque en retard toutes les tâches dont l'échéance est dépassée
 * et dont le statut n'est pas 'done'.
 *
 * Déclenché chaque jour à minuit (cron).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'overdue', updated_at: new Date().toISOString() })
    .lt('due_date', today)
    .in('status', ['todo', 'in_progress'])
    .select('id, household_id, assigned_to, title');

  if (error) {
    console.error('mark-overdue-tasks error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Marked ${data?.length ?? 0} tasks as overdue`);

  // Send push notifications for overdue tasks
  for (const task of data ?? []) {
    if (!task.assigned_to) continue;

    // Get push token
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', task.assigned_to);

    for (const { token } of tokens ?? []) {
      await sendExpoNotification(token, {
        title: '⚠ Tâche en retard',
        body: `"${task.title}" est maintenant en retard.`,
        data: { type: 'overdue', task_id: task.id },
      });
    }
  }

  return new Response(
    JSON.stringify({ success: true, marked: data?.length ?? 0 }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

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
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        ...payload,
      }),
    });
  } catch (err) {
    console.error('Push notification error:', err);
  }
}

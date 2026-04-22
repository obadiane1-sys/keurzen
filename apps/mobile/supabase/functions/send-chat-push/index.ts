/**
 * Keurzen — Edge Function: send-chat-push
 *
 * Triggered by database webhook on INSERT into messages.
 * Sends push notifications to conversation members who are not
 * currently viewing the conversation.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const payload = await req.json();
  const record = payload.record ?? payload;

  const conversationId: string = record.conversation_id;
  const senderId: string = record.sender_id;
  const content: string = record.content;

  if (!conversationId || !senderId || !content) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
  }

  // Get sender profile
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', senderId)
    .single();

  const senderName = senderProfile?.full_name ?? 'Quelqu\'un';

  // Get conversation info
  const { data: conversation } = await supabase
    .from('conversations')
    .select('type')
    .eq('id', conversationId)
    .single();

  // Get other members
  const { data: members } = await supabase
    .from('conversation_members')
    .select('user_id, last_read_at')
    .eq('conversation_id', conversationId)
    .neq('user_id', senderId);

  let sent = 0;
  const now = new Date();

  for (const member of members ?? []) {
    // Skip if last_read_at is within 30 seconds (likely has conversation open)
    const lastRead = new Date(member.last_read_at);
    if (now.getTime() - lastRead.getTime() < 30_000) continue;

    // Check notification preference
    const { data: pref } = await supabase
      .from('notification_preferences')
      .select('chat_messages')
      .eq('user_id', member.user_id)
      .single();

    if (pref && pref.chat_messages === false) continue;

    // Get push tokens
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', member.user_id);

    const title = conversation?.type === 'household'
      ? senderName
      : `Message de ${senderName}`;

    const body = content.length > 100 ? content.slice(0, 97) + '...' : content;

    for (const { token } of tokens ?? []) {
      await sendExpoNotification(token, {
        title,
        body,
        data: { conversationId, type: 'chat_message' },
      });
      sent++;
    }
  }

  return new Response(
    JSON.stringify({ success: true, notifications_sent: sent }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});

async function sendExpoNotification(
  token: string,
  payload: { title: string; body: string; data?: Record<string, unknown> },
) {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
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

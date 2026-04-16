import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import { useAuthStore } from '../stores/auth.store';
import { messagingKeys } from '../lib/queries/messaging';

/**
 * Subscribe to new messages in a specific conversation via Supabase Realtime.
 * Invalidates relevant queries on new message.
 */
export function useMessagingRealtime(conversationId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Don't invalidate if we sent this message (optimistic update handles it)
          if (payload.new.sender_id === user.id) return;

          qc.invalidateQueries({ queryKey: messagingKeys.messages(conversationId) });
          qc.invalidateQueries({ queryKey: messagingKeys.conversations(user.id) });
          qc.invalidateQueries({ queryKey: messagingKeys.unreadCount(user.id) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id, qc]);
}

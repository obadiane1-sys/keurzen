import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuthStore, useHouseholdStore } from '@keurzen/stores';
import type { Conversation, Message } from '@keurzen/shared';
import { getSupabaseClient } from '../client';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const messagingKeys = {
  conversations: (userId: string) => ['conversations', userId] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  unreadCount: (userId: string) => ['messages', 'unread', userId] as const,
};

// ─── Fetch Conversations ──────────────────────────────────────────────────────

export function useConversations() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: messagingKeys.conversations(user?.id ?? ''),
    queryFn: async () => {
      const supabase = getSupabaseClient();

      // 1. Get conversation_ids where user is a member
      const { data: memberRows, error: memberError } = await supabase
        .from('conversation_members')
        .select('conversation_id, last_read_at')
        .eq('user_id', user!.id);

      if (memberError) throw new Error(memberError.message);
      if (!memberRows || memberRows.length === 0) return [] as Conversation[];

      const conversationIds = memberRows.map((r) => r.conversation_id);

      // 2. Fetch conversations with members (joined with profiles)
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select(
          `
          *,
          members:conversation_members(
            *,
            profile:profiles(*)
          )
        `
        )
        .in('id', conversationIds);

      if (convError) throw new Error(convError.message);
      if (!conversations) return [] as Conversation[];

      // 3. For each conversation, get last message and unread count
      const enriched = await Promise.all(
        conversations.map(async (conv) => {
          const myMemberRow = memberRows.find((r) => r.conversation_id === conv.id);
          const myLastReadAt = myMemberRow?.last_read_at ?? new Date(0).toISOString();

          // Last message with sender profile
          const { data: lastMessages } = await supabase
            .from('messages')
            .select('*, sender:profiles(*)')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const lastMessage = lastMessages?.[0] ?? null;

          // Unread count: messages after my last_read_at not sent by me
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .gt('created_at', myLastReadAt)
            .neq('sender_id', user!.id);

          return {
            ...conv,
            last_message: lastMessage as Message | null,
            unread_count: unreadCount ?? 0,
          } as Conversation;
        })
      );

      // 4. Sort: household type first, then by last_message.created_at DESC
      enriched.sort((a, b) => {
        if (a.type === 'household' && b.type !== 'household') return -1;
        if (a.type !== 'household' && b.type === 'household') return 1;
        const aTime = a.last_message?.created_at ?? a.created_at;
        const bTime = b.last_message?.created_at ?? b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      return enriched;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 15,
  });
}

// ─── Fetch Messages (Infinite) ────────────────────────────────────────────────

const MESSAGES_PAGE_SIZE = 30;

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: messagingKeys.messages(conversationId),
    queryFn: async ({ pageParam }) => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('messages')
        .select('*, sender:profiles(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PAGE_SIZE);

      if (pageParam) {
        query = query.lt('created_at', pageParam as string);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data as unknown as Message[]) ?? [];
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: Message[]) => {
      if (lastPage.length < MESSAGES_PAGE_SIZE) return undefined;
      return lastPage[lastPage.length - 1]?.created_at ?? undefined;
    },
    enabled: !!conversationId,
  });
}

// ─── Unread Count (Total) ─────────────────────────────────────────────────────

export function useMessagesUnreadCount() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: messagingKeys.unreadCount(user?.id ?? ''),
    queryFn: async () => {
      const supabase = getSupabaseClient();

      // Get all user's conversation_members rows
      const { data: memberRows, error: memberError } = await supabase
        .from('conversation_members')
        .select('conversation_id, last_read_at')
        .eq('user_id', user!.id);

      if (memberError) throw new Error(memberError.message);
      if (!memberRows || memberRows.length === 0) return 0;

      // For each conversation, count unread messages
      const counts = await Promise.all(
        memberRows.map(async (row) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', row.conversation_id)
            .gt('created_at', row.last_read_at ?? new Date(0).toISOString())
            .neq('sender_id', user!.id);
          return count ?? 0;
        })
      );

      return counts.reduce((sum, c) => sum + c, 0);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 30,
  });
}

// ─── Send Message ─────────────────────────────────────────────────────────────

export function useSendMessage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user!.id,
          content: content.trim(),
        })
        .select('*, sender:profiles(*)')
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as Message;
    },
    onMutate: async ({ conversationId, content }) => {
      // Optimistic update: prepend temp message to first page of messages cache
      const queryKey = messagingKeys.messages(conversationId);
      await qc.cancelQueries({ queryKey });

      const previousData = qc.getQueryData(queryKey);

      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user!.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
      };

      qc.setQueryData(queryKey, (old: { pages: Message[][] } | undefined) => {
        if (!old) return { pages: [[tempMessage]], pageParams: [null] };
        const pages = [[tempMessage, ...(old.pages[0] ?? [])], ...old.pages.slice(1)];
        return { ...old, pages };
      });

      return { previousData, queryKey };
    },
    onError: (_err, { conversationId }, context) => {
      // Rollback optimistic update
      if (context?.previousData !== undefined) {
        qc.setQueryData(context.queryKey, context.previousData);
      }
      qc.invalidateQueries({ queryKey: messagingKeys.messages(conversationId) });
    },
    onSettled: (_data, _err, { conversationId }) => {
      qc.invalidateQueries({ queryKey: messagingKeys.messages(conversationId) });
      if (user?.id) {
        qc.invalidateQueries({ queryKey: messagingKeys.conversations(user.id) });
      }
    },
  });
}

// ─── Mark Conversation as Read ────────────────────────────────────────────────

export function useMarkConversationAsRead() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user!.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      if (user?.id) {
        qc.invalidateQueries({ queryKey: messagingKeys.conversations(user.id) });
        qc.invalidateQueries({ queryKey: messagingKeys.unreadCount(user.id) });
      }
    },
  });
}

// ─── Get or Create Household Conversation ─────────────────────────────────────

export function useGetOrCreateHouseholdConversation() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async (): Promise<string> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.rpc('get_or_create_household_conversation', {
        p_household_id: currentHousehold!.id,
      });

      if (error) throw new Error(error.message);
      return data as string;
    },
    onSuccess: () => {
      if (user?.id) {
        qc.invalidateQueries({ queryKey: messagingKeys.conversations(user.id) });
      }
    },
  });
}

// ─── Realtime Subscription ──────────────────────────────────────────────────

/**
 * Subscribe to new messages in a conversation via Supabase Realtime.
 * Invalidates relevant queries when a new message arrives from another user.
 */
export function useMessagingRealtime(conversationId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const supabase = getSupabaseClient();

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

// ─── Create Direct Conversation ───────────────────────────────────────────────

export function useCreateDirectConversation() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (otherUserId: string): Promise<string> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
        p_other_user_id: otherUserId,
      });

      if (error) throw new Error(error.message);
      return data as string;
    },
    onSuccess: () => {
      if (user?.id) {
        qc.invalidateQueries({ queryKey: messagingKeys.conversations(user.id) });
      }
    },
  });
}

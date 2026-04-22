# Messaging Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time household chat and direct messages between household members, on both mobile and web.

**Architecture:** Supabase Realtime (Postgres Changes) for live message delivery. Three new tables (`conversations`, `conversation_members`, `messages`). RLS on all tables. Edge Function for push notifications on new messages. Shared query hooks in `packages/queries` for web, local hooks in `apps/mobile/src/lib/queries/` for mobile.

**Tech Stack:** Supabase (Postgres, Realtime, Edge Functions, RLS), TanStack Query v5, Expo Router 4, Next.js, Zustand, TypeScript

---

## File Structure

### Database
- Create: `apps/mobile/supabase/migrations/20260406_create_messaging_tables.sql`
- Create: `apps/mobile/supabase/functions/send-chat-push/index.ts`

### Shared Types
- Modify: `packages/shared/src/types/index.ts` — add Conversation, ConversationMember, Message types
- Modify: `apps/mobile/src/types/index.ts` — add same types (mobile local copy)

### Shared Queries (web)
- Create: `packages/queries/src/hooks/useMessaging.ts` — all messaging hooks for web
- Modify: `packages/queries/src/index.ts` — export new hooks

### Mobile Queries
- Create: `apps/mobile/src/lib/queries/messaging.ts` — all messaging hooks for mobile

### Mobile Screens
- Create: `apps/mobile/app/(app)/messages/_layout.tsx` — Stack layout
- Create: `apps/mobile/app/(app)/messages/index.tsx` — Conversation list
- Create: `apps/mobile/app/(app)/messages/[id].tsx` — Conversation thread

### Mobile Components
- Create: `apps/mobile/src/components/messages/ConversationListItem.tsx`
- Create: `apps/mobile/src/components/messages/MessageBubble.tsx`
- Create: `apps/mobile/src/components/messages/ChatInput.tsx`
- Create: `apps/mobile/src/components/messages/ReadIndicator.tsx`
- Create: `apps/mobile/src/components/messages/NewConversationSheet.tsx`

### Web Screens
- Create: `apps/web/src/app/(app)/messages/page.tsx` — Conversation list + split view
- Create: `apps/web/src/app/(app)/messages/[id]/page.tsx` — Conversation thread (mobile web)

### Web Components
- Create: `apps/web/src/components/messages/ConversationListItem.tsx`
- Create: `apps/web/src/components/messages/MessageBubble.tsx`
- Create: `apps/web/src/components/messages/ChatInput.tsx`
- Create: `apps/web/src/components/messages/ReadIndicator.tsx`
- Create: `apps/web/src/components/messages/ConversationList.tsx`
- Create: `apps/web/src/components/messages/ConversationThread.tsx`
- Create: `apps/web/src/components/messages/NewConversationDialog.tsx`

### Navigation Updates
- Modify: `apps/mobile/app/(app)/menu/index.tsx` — add Messages row in Foyer section
- Modify: `apps/web/src/components/layout/Sidebar.tsx` — add Messages nav item
- Modify: `apps/web/src/components/layout/BottomNav.tsx` — no change (messages in sidebar/menu only)

### Notification Preferences
- Modify: `apps/mobile/supabase/migrations/20260406_create_messaging_tables.sql` — includes ALTER for chat_messages column

---

## Task 1: Database Migration

**Files:**
- Create: `apps/mobile/supabase/migrations/20260406_create_messaging_tables.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ============================================================================
-- Keurzen Messaging — tables, indexes, RLS, RPCs
-- ============================================================================

-- ─── Tables ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('household', 'direct')),
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One household conversation per household
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_household
  ON conversations (household_id) WHERE type = 'household';

CREATE INDEX IF NOT EXISTS idx_conversations_household
  ON conversations (household_id);

CREATE TABLE IF NOT EXISTS conversation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user
  ON conversation_members (user_id);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id),
  content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages (conversation_id, created_at DESC);

-- ─── Notification preference ────────────────────────────────────────────────

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS chat_messages boolean NOT NULL DEFAULT true;

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- conversations: SELECT if member
CREATE POLICY conversations_select ON conversations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_members cm
    WHERE cm.conversation_id = conversations.id
      AND cm.user_id = auth.uid()
  )
);

-- conversations: INSERT if in same household
CREATE POLICY conversations_insert ON conversations FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = conversations.household_id
      AND hm.user_id = auth.uid()
  )
);

-- conversation_members: SELECT if member of same conversation
CREATE POLICY conversation_members_select ON conversation_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_members cm2
    WHERE cm2.conversation_id = conversation_members.conversation_id
      AND cm2.user_id = auth.uid()
  )
);

-- conversation_members: UPDATE own row only (for last_read_at)
CREATE POLICY conversation_members_update ON conversation_members FOR UPDATE USING (
  user_id = auth.uid()
) WITH CHECK (
  user_id = auth.uid()
);

-- conversation_members: INSERT via RPC only — allow if user is in household
CREATE POLICY conversation_members_insert ON conversation_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN household_members hm ON hm.household_id = c.household_id
    WHERE c.id = conversation_members.conversation_id
      AND hm.user_id = auth.uid()
  )
);

-- messages: SELECT if member of conversation
CREATE POLICY messages_select ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_members cm
    WHERE cm.conversation_id = messages.conversation_id
      AND cm.user_id = auth.uid()
  )
);

-- messages: INSERT if sender is auth.uid() and member of conversation
CREATE POLICY messages_insert ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversation_members cm
    WHERE cm.conversation_id = messages.conversation_id
      AND cm.user_id = auth.uid()
  )
);

-- ─── RPCs ───────────────────────────────────────────────────────────────────

-- Get or create the household conversation
CREATE OR REPLACE FUNCTION get_or_create_household_conversation(p_household_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id uuid;
  v_member RECORD;
BEGIN
  -- Check caller is in household
  IF NOT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = p_household_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this household';
  END IF;

  -- Try to find existing
  SELECT id INTO v_conv_id
  FROM conversations
  WHERE household_id = p_household_id AND type = 'household';

  -- Create if not exists
  IF v_conv_id IS NULL THEN
    INSERT INTO conversations (household_id, type, created_by)
    VALUES (p_household_id, 'household', auth.uid())
    RETURNING id INTO v_conv_id;

    -- Add all current household members
    INSERT INTO conversation_members (conversation_id, user_id)
    SELECT v_conv_id, hm.user_id
    FROM household_members hm
    WHERE hm.household_id = p_household_id;
  ELSE
    -- Ensure caller is a member (may have joined household after conversation was created)
    INSERT INTO conversation_members (conversation_id, user_id)
    VALUES (v_conv_id, auth.uid())
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  RETURN v_conv_id;
END;
$$;

-- Get or create a direct conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(p_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id uuid;
  v_household_id uuid;
BEGIN
  -- Check both users are in the same household
  SELECT hm1.household_id INTO v_household_id
  FROM household_members hm1
  JOIN household_members hm2 ON hm2.household_id = hm1.household_id
  WHERE hm1.user_id = auth.uid()
    AND hm2.user_id = p_other_user_id
  LIMIT 1;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Users are not in the same household';
  END IF;

  -- Find existing direct conversation between these two users
  SELECT c.id INTO v_conv_id
  FROM conversations c
  WHERE c.type = 'direct'
    AND c.household_id = v_household_id
    AND EXISTS (
      SELECT 1 FROM conversation_members cm1
      WHERE cm1.conversation_id = c.id AND cm1.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM conversation_members cm2
      WHERE cm2.conversation_id = c.id AND cm2.user_id = p_other_user_id
    )
    AND (SELECT count(*) FROM conversation_members cm3 WHERE cm3.conversation_id = c.id) = 2;

  IF v_conv_id IS NULL THEN
    INSERT INTO conversations (household_id, type, created_by)
    VALUES (v_household_id, 'direct', auth.uid())
    RETURNING id INTO v_conv_id;

    INSERT INTO conversation_members (conversation_id, user_id) VALUES
      (v_conv_id, auth.uid()),
      (v_conv_id, p_other_user_id);
  END IF;

  RETURN v_conv_id;
END;
$$;

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

- [ ] **Step 2: Apply the migration**

Run: `cd apps/mobile && npx supabase db push`
Expected: Migration applies successfully, tables created.

- [ ] **Step 3: Verify tables exist**

Run: `cd apps/mobile && npx supabase db reset --dry-run` (or check via Supabase dashboard)
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/supabase/migrations/20260406_create_messaging_tables.sql
git commit -m "feat(db): add messaging tables, RLS, RPCs for conversations and messages"
```

---

## Task 2: Shared Types

**Files:**
- Modify: `packages/shared/src/types/index.ts`
- Modify: `apps/mobile/src/types/index.ts`

- [ ] **Step 1: Add types to `packages/shared/src/types/index.ts`**

Add at the end of the file, before the utility types section:

```typescript
// ─── Messaging ───────────────────────────────────────────────────────────────

export type ConversationType = 'household' | 'direct';

export interface Conversation {
  id: string;
  household_id: string;
  type: ConversationType;
  created_by: string;
  created_at: string;
  // Joined / computed
  members?: ConversationMember[];
  last_message?: Message;
  unread_count?: number;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at: string;
  joined_at: string;
  // Joined
  profile?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  // Joined
  sender?: Profile;
}
```

- [ ] **Step 2: Add the same types to `apps/mobile/src/types/index.ts`**

Add the exact same block at the end of the file, before the utility types section.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/index.ts apps/mobile/src/types/index.ts
git commit -m "feat(types): add Conversation, ConversationMember, Message types"
```

---

## Task 3: Mobile Query Hooks

**Files:**
- Create: `apps/mobile/src/lib/queries/messaging.ts`

- [ ] **Step 1: Create the messaging query hooks file**

```typescript
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { useAuthStore } from '../../stores/auth.store';
import { useHouseholdStore } from '../../stores/household.store';
import type { Conversation, ConversationMember, Message } from '../../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const messagingKeys = {
  conversations: (userId: string) => ['conversations', userId] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  unreadCount: (userId: string) => ['messages', 'unread', userId] as const,
};

// ─── Conversations List ─────────────────────────────────────────────────────

export function useConversations() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: messagingKeys.conversations(user?.id ?? ''),
    queryFn: async () => {
      // Get conversations the user is a member of
      const { data: memberRows, error: mErr } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user!.id);

      if (mErr) throw new Error(mErr.message);
      if (!memberRows || memberRows.length === 0) return [];

      const convIds = memberRows.map((r) => r.conversation_id);

      // Fetch conversations with members
      const { data: conversations, error: cErr } = await supabase
        .from('conversations')
        .select('*, members:conversation_members(*, profile:profiles(*))')
        .in('id', convIds)
        .order('created_at', { ascending: false });

      if (cErr) throw new Error(cErr.message);

      // For each conversation, get the last message and unread count
      const result: Conversation[] = [];

      for (const conv of conversations ?? []) {
        // Last message
        const { data: lastMsgArr } = await supabase
          .from('messages')
          .select('*, sender:profiles(*)')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessage = lastMsgArr?.[0] as Message | undefined;

        // Unread count — messages after user's last_read_at
        const myMembership = (conv.members as ConversationMember[])?.find(
          (m) => m.user_id === user!.id,
        );
        let unreadCount = 0;
        if (myMembership) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .gt('created_at', myMembership.last_read_at)
            .neq('sender_id', user!.id);
          unreadCount = count ?? 0;
        }

        result.push({
          ...conv,
          members: conv.members as ConversationMember[],
          last_message: lastMessage,
          unread_count: unreadCount,
        } as Conversation);
      }

      // Sort: household first, then by last_message.created_at desc
      result.sort((a, b) => {
        if (a.type === 'household' && b.type !== 'household') return -1;
        if (b.type === 'household' && a.type !== 'household') return 1;
        const aTime = a.last_message?.created_at ?? a.created_at;
        const bTime = b.last_message?.created_at ?? b.created_at;
        return bTime.localeCompare(aTime);
      });

      return result;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 15,
  });
}

// ─── Messages (Infinite Query) ──────────────────────────────────────────────

const MESSAGES_PER_PAGE = 30;

export function useMessages(conversationId: string | undefined) {
  return useInfiniteQuery({
    queryKey: messagingKeys.messages(conversationId ?? ''),
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('messages')
        .select('*, sender:profiles(*)')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (pageParam) {
        query = query.lt('created_at', pageParam);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data as Message[]) ?? [];
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < MESSAGES_PER_PAGE) return undefined;
      return lastPage[lastPage.length - 1]?.created_at ?? undefined;
    },
    enabled: !!conversationId,
  });
}

// ─── Unread Count (total across all conversations) ──────────────────────────

export function useMessagesUnreadCount() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: messagingKeys.unreadCount(user?.id ?? ''),
    queryFn: async () => {
      // Get all user's conversation memberships
      const { data: memberships, error: mErr } = await supabase
        .from('conversation_members')
        .select('conversation_id, last_read_at')
        .eq('user_id', user!.id);

      if (mErr) throw new Error(mErr.message);
      if (!memberships || memberships.length === 0) return 0;

      let total = 0;
      for (const m of memberships) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', m.conversation_id)
          .gt('created_at', m.last_read_at)
          .neq('sender_id', user!.id);
        total += count ?? 0;
      }

      return total;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 30,
  });
}

// ─── Send Message ───────────────────────────────────────────────────────────

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
      return data as Message;
    },
    onMutate: async ({ conversationId, content }) => {
      // Optimistic update: add message to cache immediately
      await qc.cancelQueries({ queryKey: messagingKeys.messages(conversationId) });

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user!.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
      };

      qc.setQueryData(
        messagingKeys.messages(conversationId),
        (old: any) => {
          if (!old) return { pages: [[optimisticMessage]], pageParams: [null] };
          return {
            ...old,
            pages: [[optimisticMessage, ...old.pages[0]], ...old.pages.slice(1)],
          };
        },
      );

      return { optimisticMessage };
    },
    onError: (_err, { conversationId }) => {
      // Rollback: refetch on error
      qc.invalidateQueries({ queryKey: messagingKeys.messages(conversationId) });
    },
    onSettled: (_data, _err, { conversationId }) => {
      qc.invalidateQueries({ queryKey: messagingKeys.messages(conversationId) });
      qc.invalidateQueries({ queryKey: messagingKeys.conversations(user?.id ?? '') });
    },
  });
}

// ─── Mark as Read ───────────────────────────────────────────────────────────

export function useMarkConversationAsRead() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (conversationId: string) => {
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

// ─── Get or Create Household Conversation ───────────────────────────────────

export function useGetOrCreateHouseholdConversation() {
  const { currentHousehold } = useHouseholdStore();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc(
        'get_or_create_household_conversation',
        { p_household_id: currentHousehold!.id },
      );

      if (error) throw new Error(error.message);
      return data as string;
    },
  });
}

// ─── Get or Create Direct Conversation ──────────────────────────────────────

export function useCreateDirectConversation() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const { data, error } = await supabase.rpc(
        'get_or_create_direct_conversation',
        { p_other_user_id: otherUserId },
      );

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
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/lib/queries/messaging.ts
git commit -m "feat(mobile): add messaging query hooks"
```

---

## Task 4: Web Query Hooks (packages/queries)

**Files:**
- Create: `packages/queries/src/hooks/useMessaging.ts`
- Modify: `packages/queries/src/index.ts`

- [ ] **Step 1: Create `packages/queries/src/hooks/useMessaging.ts`**

Same logic as mobile hooks but using `getSupabaseClient()` instead of direct import, and `@keurzen/stores` / `@keurzen/shared` imports:

```typescript
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuthStore, useHouseholdStore } from '@keurzen/stores';
import type { Conversation, ConversationMember, Message } from '@keurzen/shared';
import { getSupabaseClient } from '../client';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const messagingKeys = {
  conversations: (userId: string) => ['conversations', userId] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  unreadCount: (userId: string) => ['messages', 'unread', userId] as const,
};

// ─── Conversations List ─────────────────────────────────────────────────────

export function useConversations() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: messagingKeys.conversations(user?.id ?? ''),
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data: memberRows, error: mErr } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user!.id);

      if (mErr) throw new Error(mErr.message);
      if (!memberRows || memberRows.length === 0) return [];

      const convIds = memberRows.map((r) => r.conversation_id);

      const { data: conversations, error: cErr } = await supabase
        .from('conversations')
        .select('*, members:conversation_members(*, profile:profiles(*))')
        .in('id', convIds)
        .order('created_at', { ascending: false });

      if (cErr) throw new Error(cErr.message);

      const result: Conversation[] = [];

      for (const conv of conversations ?? []) {
        const { data: lastMsgArr } = await supabase
          .from('messages')
          .select('*, sender:profiles(*)')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessage = lastMsgArr?.[0] as Message | undefined;

        const myMembership = (conv.members as ConversationMember[])?.find(
          (m) => m.user_id === user!.id,
        );
        let unreadCount = 0;
        if (myMembership) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .gt('created_at', myMembership.last_read_at)
            .neq('sender_id', user!.id);
          unreadCount = count ?? 0;
        }

        result.push({
          ...conv,
          members: conv.members as ConversationMember[],
          last_message: lastMessage,
          unread_count: unreadCount,
        } as Conversation);
      }

      result.sort((a, b) => {
        if (a.type === 'household' && b.type !== 'household') return -1;
        if (b.type === 'household' && a.type !== 'household') return 1;
        const aTime = a.last_message?.created_at ?? a.created_at;
        const bTime = b.last_message?.created_at ?? b.created_at;
        return bTime.localeCompare(aTime);
      });

      return result;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 15,
  });
}

// ─── Messages (Infinite Query) ──────────────────────────────────────────────

const MESSAGES_PER_PAGE = 30;

export function useMessages(conversationId: string | undefined) {
  return useInfiniteQuery({
    queryKey: messagingKeys.messages(conversationId ?? ''),
    queryFn: async ({ pageParam }) => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('messages')
        .select('*, sender:profiles(*)')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (pageParam) {
        query = query.lt('created_at', pageParam);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data as Message[]) ?? [];
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < MESSAGES_PER_PAGE) return undefined;
      return lastPage[lastPage.length - 1]?.created_at ?? undefined;
    },
    enabled: !!conversationId,
  });
}

// ─── Unread Count ───────────────────────────────────────────────────────────

export function useMessagesUnreadCount() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: messagingKeys.unreadCount(user?.id ?? ''),
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const { data: memberships, error: mErr } = await supabase
        .from('conversation_members')
        .select('conversation_id, last_read_at')
        .eq('user_id', user!.id);

      if (mErr) throw new Error(mErr.message);
      if (!memberships || memberships.length === 0) return 0;

      let total = 0;
      for (const m of memberships) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', m.conversation_id)
          .gt('created_at', m.last_read_at)
          .neq('sender_id', user!.id);
        total += count ?? 0;
      }

      return total;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 30,
  });
}

// ─── Send Message ───────────────────────────────────────────────────────────

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
      return data as Message;
    },
    onMutate: async ({ conversationId, content }) => {
      await qc.cancelQueries({ queryKey: messagingKeys.messages(conversationId) });

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user!.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
      };

      qc.setQueryData(
        messagingKeys.messages(conversationId),
        (old: any) => {
          if (!old) return { pages: [[optimisticMessage]], pageParams: [null] };
          return {
            ...old,
            pages: [[optimisticMessage, ...old.pages[0]], ...old.pages.slice(1)],
          };
        },
      );

      return { optimisticMessage };
    },
    onError: (_err, { conversationId }) => {
      qc.invalidateQueries({ queryKey: messagingKeys.messages(conversationId) });
    },
    onSettled: (_data, _err, { conversationId }) => {
      qc.invalidateQueries({ queryKey: messagingKeys.messages(conversationId) });
      qc.invalidateQueries({ queryKey: messagingKeys.conversations(user?.id ?? '') });
    },
  });
}

// ─── Mark as Read ───────────────────────────────────────────────────────────

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

// ─── Get or Create Household Conversation ───────────────────────────────────

export function useGetOrCreateHouseholdConversation() {
  const { currentHousehold } = useHouseholdStore();

  return useMutation({
    mutationFn: async () => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.rpc(
        'get_or_create_household_conversation',
        { p_household_id: currentHousehold!.id },
      );

      if (error) throw new Error(error.message);
      return data as string;
    },
  });
}

// ─── Create Direct Conversation ─────────────────────────────────────────────

export function useCreateDirectConversation() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.rpc(
        'get_or_create_direct_conversation',
        { p_other_user_id: otherUserId },
      );

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
```

- [ ] **Step 2: Add export to `packages/queries/src/index.ts`**

Add this line:

```typescript
export * from './hooks/useMessaging';
```

- [ ] **Step 3: Commit**

```bash
git add packages/queries/src/hooks/useMessaging.ts packages/queries/src/index.ts
git commit -m "feat(queries): add shared messaging hooks for web"
```

---

## Task 5: Mobile Realtime Hook

**Files:**
- Create: `apps/mobile/src/hooks/useMessagingRealtime.ts`

- [ ] **Step 1: Create the realtime hook**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/hooks/useMessagingRealtime.ts
git commit -m "feat(mobile): add realtime subscription hook for messaging"
```

---

## Task 6: Mobile Components

**Files:**
- Create: `apps/mobile/src/components/messages/ConversationListItem.tsx`
- Create: `apps/mobile/src/components/messages/MessageBubble.tsx`
- Create: `apps/mobile/src/components/messages/ChatInput.tsx`
- Create: `apps/mobile/src/components/messages/ReadIndicator.tsx`
- Create: `apps/mobile/src/components/messages/NewConversationSheet.tsx`

- [ ] **Step 1: Create `ConversationListItem.tsx`**

```tsx
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { Colors, Spacing, BorderRadius } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { Conversation, Profile } from '../../types';

interface Props {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
}

export function ConversationListItem({ conversation, currentUserId, onPress }: Props) {
  const isHousehold = conversation.type === 'household';
  const otherMembers = conversation.members?.filter((m) => m.user_id !== currentUserId) ?? [];
  const title = isHousehold
    ? 'Groupe foyer'
    : otherMembers.map((m) => m.profile?.full_name ?? 'Membre').join(', ');

  const lastMsg = conversation.last_message;
  const unread = conversation.unread_count ?? 0;

  const timeLabel = lastMsg
    ? dayjs(lastMsg.created_at).format(
        dayjs().isSame(lastMsg.created_at, 'day') ? 'HH:mm' : 'DD/MM',
      )
    : '';

  const previewSender =
    lastMsg?.sender_id === currentUserId
      ? 'Vous'
      : lastMsg?.sender?.full_name?.split(' ')[0] ?? '';
  const preview = lastMsg
    ? `${previewSender}: ${lastMsg.content}`
    : 'Aucun message';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.avatar, isHousehold && styles.avatarHousehold]}>
        <Ionicons
          name={isHousehold ? 'home' : 'person'}
          size={20}
          color={isHousehold ? Colors.sauge : Colors.terracotta}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text variant="label" weight="semibold" numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <Text variant="caption" color="muted">
            {timeLabel}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            variant="bodySmall"
            color={unread > 0 ? 'primary' : 'muted'}
            weight={unread > 0 ? 'medium' : 'regular'}
            numberOfLines={1}
            style={styles.preview}
          >
            {preview}
          </Text>
          {unread > 0 && (
            <View style={styles.badge}>
              <Text variant="caption" color="inverse" weight="bold" style={styles.badgeText}>
                {unread > 99 ? '99+' : unread}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.card,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.terracotta}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHousehold: {
    backgroundColor: `${Colors.sauge}1A`,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.terracotta,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
  },
});
```

- [ ] **Step 2: Create `MessageBubble.tsx`**

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import { Colors, Spacing, BorderRadius } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { Message } from '../../types';

interface Props {
  message: Message;
  isOwn: boolean;
  showSenderName: boolean;
}

export function MessageBubble({ message, isOwn, showSenderName }: Props) {
  const time = dayjs(message.created_at).format('HH:mm');

  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {showSenderName && !isOwn && (
          <Text variant="caption" weight="semibold" style={styles.senderName}>
            {message.sender?.full_name ?? 'Membre'}
          </Text>
        )}
        <Text variant="body" style={isOwn ? styles.textOwn : styles.textOther}>
          {message.content}
        </Text>
        <Text variant="caption" style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.base,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bubbleOwn: {
    backgroundColor: Colors.terracotta,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    color: Colors.terracotta,
    marginBottom: 2,
  },
  textOwn: {
    color: Colors.textInverse,
  },
  textOther: {
    color: Colors.textPrimary,
  },
  time: {
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  timeOwn: {
    color: 'rgba(255,253,249,0.7)',
  },
  timeOther: {
    color: Colors.textMuted,
  },
});
```

- [ ] **Step 3: Create `ChatInput.tsx`**

```tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, TouchTarget } from '../../constants/tokens';

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Votre message..."
        placeholderTextColor={Colors.placeholder}
        multiline
        maxLength={2000}
        editable={!disabled}
      />
      <TouchableOpacity
        style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
        onPress={handleSend}
        disabled={!text.trim() || disabled}
        activeOpacity={0.7}
      >
        <Ionicons
          name="send"
          size={20}
          color={text.trim() ? Colors.textInverse : Colors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    minHeight: TouchTarget.min,
    maxHeight: 120,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.borderLight,
  },
});
```

- [ ] **Step 4: Create `ReadIndicator.tsx`**

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { ConversationMember, Message } from '../../types';

interface Props {
  message: Message;
  members: ConversationMember[];
  currentUserId: string;
}

export function ReadIndicator({ message, members, currentUserId }: Props) {
  const readBy = members.filter(
    (m) =>
      m.user_id !== currentUserId &&
      m.last_read_at >= message.created_at,
  );

  if (readBy.length === 0) return null;

  const names = readBy
    .map((m) => m.profile?.full_name?.split(' ')[0] ?? 'Membre')
    .join(', ');

  return (
    <View style={styles.container}>
      <Ionicons name="checkmark-done" size={14} color={Colors.sauge} />
      <Text variant="caption" color="muted">
        Vu par {names}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xs,
    justifyContent: 'flex-end',
  },
});
```

- [ ] **Step 5: Create `NewConversationSheet.tsx`**

```tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/tokens';
import { Text } from '../ui/Text';
import type { HouseholdMember } from '../../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  members: HouseholdMember[];
  currentUserId: string;
  onSelect: (userId: string) => void;
}

export function NewConversationSheet({ visible, onClose, members, currentUserId, onSelect }: Props) {
  const otherMembers = members.filter((m) => m.user_id !== currentUserId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text variant="h4" weight="semibold" style={styles.title}>
            Nouveau message
          </Text>
          {otherMembers.map((member) => (
            <TouchableOpacity
              key={member.user_id}
              style={styles.memberRow}
              onPress={() => onSelect(member.user_id)}
              activeOpacity={0.7}
            >
              <View style={[styles.dot, { backgroundColor: member.color }]} />
              <Text variant="body" weight="medium">
                {member.profile?.full_name ?? 'Membre'}
              </Text>
            </TouchableOpacity>
          ))}
          {otherMembers.length === 0 && (
            <Text variant="bodySmall" color="muted" style={styles.empty}>
              Aucun autre membre dans votre foyer.
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
    paddingTop: Spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});
```

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/components/messages/
git commit -m "feat(mobile): add messaging UI components"
```

---

## Task 7: Mobile Screens

**Files:**
- Create: `apps/mobile/app/(app)/messages/_layout.tsx`
- Create: `apps/mobile/app/(app)/messages/index.tsx`
- Create: `apps/mobile/app/(app)/messages/[id].tsx`

- [ ] **Step 1: Create `_layout.tsx`**

```tsx
import { Stack } from 'expo-router';

export default function MessagesLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2: Create `index.tsx` — Conversation List**

```tsx
import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, FlatList, View, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, TouchTarget } from '../../../src/constants/tokens';
import { Text } from '../../../src/components/ui/Text';
import { Loader } from '../../../src/components/ui/Loader';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { ConversationListItem } from '../../../src/components/messages/ConversationListItem';
import { NewConversationSheet } from '../../../src/components/messages/NewConversationSheet';
import {
  useConversations,
  useGetOrCreateHouseholdConversation,
  useCreateDirectConversation,
} from '../../../src/lib/queries/messaging';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useHouseholdStore } from '../../../src/stores/household.store';
import type { Conversation } from '../../../src/types';

export default function MessagesListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentHousehold, members } = useHouseholdStore();
  const { data: conversations = [], isLoading, refetch, isRefetching } = useConversations();
  const getOrCreateHousehold = useGetOrCreateHouseholdConversation();
  const createDirect = useCreateDirectConversation();
  const [showNewSheet, setShowNewSheet] = useState(false);

  // Ensure household conversation exists on first load
  useEffect(() => {
    if (currentHousehold?.id && !isLoading) {
      getOrCreateHousehold.mutate();
    }
  }, [currentHousehold?.id, isLoading]);

  const handleConversationPress = useCallback(
    (conv: Conversation) => {
      router.push(`/(app)/messages/${conv.id}`);
    },
    [router],
  );

  const handleNewDirect = useCallback(
    async (otherUserId: string) => {
      setShowNewSheet(false);
      const convId = await createDirect.mutateAsync(otherUserId);
      router.push(`/(app)/messages/${convId}`);
    },
    [createDirect, router],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Loader fullScreen label="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Messages"
        rightAction={
          <TouchableOpacity onPress={() => setShowNewSheet(true)}>
            <Ionicons name="create-outline" size={22} color={Colors.terracotta} />
          </TouchableOpacity>
        }
      />

      {conversations.length === 0 ? (
        <EmptyState
          variant="generic"
          title="Pas encore de messages"
          subtitle="Commencez une conversation avec votre foyer."
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationListItem
              conversation={item}
              currentUserId={user!.id}
              onPress={() => handleConversationPress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.terracotta}
              colors={[Colors.terracotta]}
            />
          }
        />
      )}

      <NewConversationSheet
        visible={showNewSheet}
        onClose={() => setShowNewSheet(false)}
        members={members}
        currentUserId={user!.id}
        onSelect={handleNewDirect}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  separator: {
    height: Spacing.sm,
  },
});
```

- [ ] **Step 3: Create `[id].tsx` — Conversation Thread**

```tsx
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, FlatList, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { Colors, Spacing } from '../../../src/constants/tokens';
import { Loader } from '../../../src/components/ui/Loader';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { MessageBubble } from '../../../src/components/messages/MessageBubble';
import { ChatInput } from '../../../src/components/messages/ChatInput';
import { ReadIndicator } from '../../../src/components/messages/ReadIndicator';
import {
  useMessages,
  useSendMessage,
  useMarkConversationAsRead,
  useConversations,
} from '../../../src/lib/queries/messaging';
import { useMessagingRealtime } from '../../../src/hooks/useMessagingRealtime';
import { useAuthStore } from '../../../src/stores/auth.store';
import type { Message, ConversationMember } from '../../../src/types';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { data: messagesData, isLoading, fetchNextPage, hasNextPage } = useMessages(id);
  const { data: conversations = [] } = useConversations();
  const sendMessage = useSendMessage();
  const markAsRead = useMarkConversationAsRead();
  const flatListRef = useRef<FlatList>(null);

  // Realtime subscription
  useMessagingRealtime(id);

  // Find current conversation for header and members
  const conversation = conversations.find((c) => c.id === id);
  const members = (conversation?.members ?? []) as ConversationMember[];
  const isHousehold = conversation?.type === 'household';

  const title = isHousehold
    ? 'Groupe foyer'
    : members
        .filter((m) => m.user_id !== user!.id)
        .map((m) => m.profile?.full_name ?? 'Membre')
        .join(', ') || 'Conversation';

  // Flatten pages into a single array (newest first)
  const messages = useMemo(
    () => messagesData?.pages.flat() ?? [],
    [messagesData],
  );

  // Mark as read on mount and when new messages arrive
  useEffect(() => {
    if (id) {
      markAsRead.mutate(id);
    }
  }, [id, messages.length]);

  // Find the user's last sent message for read indicator
  const lastOwnMessageId = useMemo(() => {
    const ownMessages = messages.filter((m) => m.sender_id === user!.id);
    return ownMessages[0]?.id;
  }, [messages, user]);

  const handleSend = useCallback(
    (content: string) => {
      if (!id) return;
      sendMessage.mutate({ conversationId: id, content });
    },
    [id, sendMessage],
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Loader fullScreen label="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={title} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <MessageBubble
                message={item}
                isOwn={item.sender_id === user!.id}
                showSenderName={isHousehold}
              />
              {item.id === lastOwnMessageId && (
                <ReadIndicator
                  message={item}
                  members={members}
                  currentUserId={user!.id}
                />
              )}
            </View>
          )}
          inverted
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
        />

        <ChatInput onSend={handleSend} disabled={sendMessage.isPending} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: Spacing.sm,
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/(app)/messages/
git commit -m "feat(mobile): add messages screens (list + conversation thread)"
```

---

## Task 8: Mobile Navigation — Add Messages to Menu

**Files:**
- Modify: `apps/mobile/app/(app)/menu/index.tsx`

- [ ] **Step 1: Add Messages row to the Foyer section**

In `apps/mobile/app/(app)/menu/index.tsx`, add a `MenuRow` for messages inside the "Foyer" `<MenuSection>`, right after the "Mon foyer" row (line ~209):

```tsx
<MenuRow
  icon="chatbubbles-outline"
  label="Messages"
  color={Colors.terracotta}
  onPress={() => router.push('/(app)/messages')}
/>
```

Also import and display the unread badge. Add to imports:

```typescript
import { useMessagesUnreadCount } from '../../../src/lib/queries/messaging';
```

Add inside `MenuScreen()` component:

```typescript
const { data: msgUnreadCount = 0 } = useMessagesUnreadCount();
```

Update the MenuRow to include a badge indicator (pass the count as a suffix in the label or add a badge prop if `MenuRow` supports it). If `MenuRow` doesn't support a badge, append it to the label:

```tsx
<MenuRow
  icon="chatbubbles-outline"
  label={msgUnreadCount > 0 ? `Messages (${msgUnreadCount})` : 'Messages'}
  color={Colors.terracotta}
  onPress={() => router.push('/(app)/messages')}
/>
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/(app)/menu/index.tsx
git commit -m "feat(mobile): add Messages entry in general menu"
```

---

## Task 9: Web Components

**Files:**
- Create: `apps/web/src/components/messages/ConversationListItem.tsx`
- Create: `apps/web/src/components/messages/MessageBubble.tsx`
- Create: `apps/web/src/components/messages/ChatInput.tsx`
- Create: `apps/web/src/components/messages/ReadIndicator.tsx`
- Create: `apps/web/src/components/messages/ConversationList.tsx`
- Create: `apps/web/src/components/messages/ConversationThread.tsx`
- Create: `apps/web/src/components/messages/NewConversationDialog.tsx`

- [ ] **Step 1: Create `ConversationListItem.tsx`**

```tsx
'use client';

import dayjs from 'dayjs';
import { Home, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@keurzen/shared';

interface Props {
  conversation: Conversation;
  currentUserId: string;
  isActive?: boolean;
  onClick: () => void;
}

export function ConversationListItem({ conversation, currentUserId, isActive, onClick }: Props) {
  const isHousehold = conversation.type === 'household';
  const otherMembers = conversation.members?.filter((m) => m.user_id !== currentUserId) ?? [];
  const title = isHousehold
    ? 'Groupe foyer'
    : otherMembers.map((m) => m.profile?.full_name ?? 'Membre').join(', ');

  const lastMsg = conversation.last_message;
  const unread = conversation.unread_count ?? 0;

  const timeLabel = lastMsg
    ? dayjs(lastMsg.created_at).format(dayjs().isSame(lastMsg.created_at, 'day') ? 'HH:mm' : 'DD/MM')
    : '';

  const previewSender = lastMsg?.sender_id === currentUserId
    ? 'Vous'
    : lastMsg?.sender?.full_name?.split(' ')[0] ?? '';
  const preview = lastMsg ? `${previewSender}: ${lastMsg.content}` : 'Aucun message';

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-[var(--radius-card)] p-3 text-left transition-colors',
        isActive ? 'bg-border-light' : 'hover:bg-border-light/50',
      )}
    >
      <div className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
        isHousehold ? 'bg-sauge/15' : 'bg-terracotta/15',
      )}>
        {isHousehold ? <Home size={18} className="text-sauge" /> : <User size={18} className="text-terracotta" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-semibold text-text-primary">{title}</span>
          <span className="shrink-0 text-xs text-text-muted">{timeLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'truncate text-xs',
            unread > 0 ? 'font-medium text-text-primary' : 'text-text-muted',
          )}>
            {preview}
          </span>
          {unread > 0 && (
            <span className="shrink-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-terracotta px-1.5 text-[10px] font-bold text-text-inverse">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Create `MessageBubble.tsx`**

```tsx
'use client';

import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import type { Message } from '@keurzen/shared';

interface Props {
  message: Message;
  isOwn: boolean;
  showSenderName: boolean;
}

export function MessageBubble({ message, isOwn, showSenderName }: Props) {
  const time = dayjs(message.created_at).format('HH:mm');

  return (
    <div className={cn('flex mb-1 px-4', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[78%] rounded-2xl px-3 py-2',
        isOwn
          ? 'bg-terracotta text-text-inverse rounded-br-sm'
          : 'bg-background-card border border-border-light rounded-bl-sm',
      )}>
        {showSenderName && !isOwn && (
          <p className="text-xs font-semibold text-terracotta mb-0.5">
            {message.sender?.full_name ?? 'Membre'}
          </p>
        )}
        <p className={cn('text-sm', isOwn ? 'text-text-inverse' : 'text-text-primary')}>
          {message.content}
        </p>
        <p className={cn(
          'text-[10px] text-right mt-0.5',
          isOwn ? 'text-white/70' : 'text-text-muted',
        )}>
          {time}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `ChatInput.tsx`**

```tsx
'use client';

import { useState, useRef } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-border-light bg-background px-4 py-2">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => { setText(e.target.value); handleInput(); }}
        onKeyDown={handleKeyDown}
        placeholder="Votre message..."
        maxLength={2000}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-border bg-background-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-terracotta focus:outline-none"
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-terracotta text-text-inverse transition-colors disabled:bg-border-light disabled:text-text-muted"
      >
        <Send size={18} />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Create `ReadIndicator.tsx`**

```tsx
'use client';

import { CheckCheck } from 'lucide-react';
import type { ConversationMember, Message } from '@keurzen/shared';

interface Props {
  message: Message;
  members: ConversationMember[];
  currentUserId: string;
}

export function ReadIndicator({ message, members, currentUserId }: Props) {
  const readBy = members.filter(
    (m) => m.user_id !== currentUserId && m.last_read_at >= message.created_at,
  );

  if (readBy.length === 0) return null;

  const names = readBy.map((m) => m.profile?.full_name?.split(' ')[0] ?? 'Membre').join(', ');

  return (
    <div className="flex items-center justify-end gap-1 px-4 pb-1">
      <CheckCheck size={14} className="text-sauge" />
      <span className="text-xs text-text-muted">Vu par {names}</span>
    </div>
  );
}
```

- [ ] **Step 5: Create `ConversationList.tsx`**

```tsx
'use client';

import { ConversationListItem } from './ConversationListItem';
import type { Conversation } from '@keurzen/shared';

interface Props {
  conversations: Conversation[];
  currentUserId: string;
  activeId?: string;
  onSelect: (conv: Conversation) => void;
}

export function ConversationList({ conversations, currentUserId, activeId, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-1 p-2">
      {conversations.map((conv) => (
        <ConversationListItem
          key={conv.id}
          conversation={conv}
          currentUserId={currentUserId}
          isActive={conv.id === activeId}
          onClick={() => onSelect(conv)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create `ConversationThread.tsx`**

```tsx
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ReadIndicator } from './ReadIndicator';
import {
  useMessages,
  useSendMessage,
  useMarkConversationAsRead,
} from '@keurzen/queries';
import { useAuthStore } from '@keurzen/stores';
import type { Conversation, ConversationMember } from '@keurzen/shared';

interface Props {
  conversation: Conversation;
}

export function ConversationThread({ conversation }: Props) {
  const { user } = useAuthStore();
  const { data: messagesData, isLoading, fetchNextPage, hasNextPage } = useMessages(conversation.id);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkConversationAsRead();
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(
    () => messagesData?.pages.flat() ?? [],
    [messagesData],
  );

  const members = (conversation.members ?? []) as ConversationMember[];
  const isHousehold = conversation.type === 'household';

  // Mark as read
  useEffect(() => {
    markAsRead.mutate(conversation.id);
  }, [conversation.id, messages.length]);

  // Find last own message for read indicator
  const lastOwnMessageId = useMemo(() => {
    const own = messages.filter((m) => m.sender_id === user!.id);
    return own[0]?.id;
  }, [messages, user]);

  const handleSend = (content: string) => {
    sendMessage.mutate({ conversationId: conversation.id, content });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !hasNextPage) return;
    if (el.scrollTop < 100) {
      fetchNextPage();
    }
  };

  // Reversed messages for display (oldest at top)
  const reversed = useMemo(() => [...messages].reverse(), [messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-2"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-text-muted">Chargement...</span>
          </div>
        ) : (
          reversed.map((msg) => (
            <div key={msg.id}>
              <MessageBubble
                message={msg}
                isOwn={msg.sender_id === user!.id}
                showSenderName={isHousehold}
              />
              {msg.id === lastOwnMessageId && (
                <ReadIndicator
                  message={msg}
                  members={members}
                  currentUserId={user!.id}
                />
              )}
            </div>
          ))
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={sendMessage.isPending} />
    </div>
  );
}
```

- [ ] **Step 7: Create `NewConversationDialog.tsx`**

```tsx
'use client';

import { X } from 'lucide-react';
import type { HouseholdMember } from '@keurzen/shared';

interface Props {
  open: boolean;
  onClose: () => void;
  members: HouseholdMember[];
  currentUserId: string;
  onSelect: (userId: string) => void;
}

export function NewConversationDialog({ open, onClose, members, currentUserId, onSelect }: Props) {
  if (!open) return null;

  const otherMembers = members.filter((m) => m.user_id !== currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Nouveau message</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-border-light">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        {otherMembers.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">
            Aucun autre membre dans votre foyer.
          </p>
        ) : (
          <div className="space-y-1">
            {otherMembers.map((member) => (
              <button
                key={member.user_id}
                onClick={() => onSelect(member.user_id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-border-light"
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: member.color }}
                />
                <span className="text-sm font-medium text-text-primary">
                  {member.profile?.full_name ?? 'Membre'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/messages/
git commit -m "feat(web): add messaging UI components"
```

---

## Task 10: Web Screens

**Files:**
- Create: `apps/web/src/app/(app)/messages/page.tsx`
- Create: `apps/web/src/app/(app)/messages/[id]/page.tsx`

- [ ] **Step 1: Create `page.tsx` — Messages page with split layout**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Plus } from 'lucide-react';
import { useConversations, useGetOrCreateHouseholdConversation, useCreateDirectConversation } from '@keurzen/queries';
import { useAuthStore } from '@keurzen/stores';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConversationList } from '@/components/messages/ConversationList';
import { ConversationThread } from '@/components/messages/ConversationThread';
import { NewConversationDialog } from '@/components/messages/NewConversationDialog';
import type { Conversation, HouseholdMember } from '@keurzen/shared';

export default function MessagesPage() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { data: conversations = [], isLoading } = useConversations();
  const getOrCreateHousehold = useGetOrCreateHouseholdConversation();
  const createDirect = useCreateDirectConversation();
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [showNew, setShowNew] = useState(false);

  // Ensure household conversation exists
  useEffect(() => {
    if (!isLoading) {
      getOrCreateHousehold.mutate();
    }
  }, [isLoading]);

  // Auto-select first conversation on desktop
  useEffect(() => {
    if (conversations.length > 0 && !selectedConv) {
      setSelectedConv(conversations[0]);
    }
  }, [conversations, selectedConv]);

  const handleSelect = useCallback((conv: Conversation) => {
    setSelectedConv(conv);
  }, []);

  const handleNewDirect = useCallback(async (otherUserId: string) => {
    setShowNew(false);
    const convId = await createDirect.mutateAsync(otherUserId);
    const conv = conversations.find((c) => c.id === convId);
    if (conv) setSelectedConv(conv);
  }, [createDirect, conversations]);

  // Get household members for new conversation dialog
  const allMembers = conversations
    .flatMap((c) => c.members ?? [])
    .filter((m, i, arr) => arr.findIndex((x) => x.user_id === m.user_id) === i) as HouseholdMember[];

  return (
    <div className="flex h-[calc(100vh-6rem)] -mx-4 -my-6 md:-mx-8 md:-my-8">
      {/* Left panel: conversation list */}
      <div className="w-full md:w-80 lg:w-96 shrink-0 border-r border-border flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
          <h2 className="text-lg font-semibold text-text-primary">Messages</h2>
          <button
            onClick={() => setShowNew(true)}
            className="rounded-full p-2 hover:bg-border-light transition-colors"
          >
            <Plus size={20} className="text-terracotta" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-text-muted">Chargement...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4">
            <MessageCircle size={40} className="text-text-muted" />
            <p className="text-sm text-text-muted text-center">Pas encore de messages</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              conversations={conversations}
              currentUserId={user!.id}
              activeId={selectedConv?.id}
              onSelect={handleSelect}
            />
          </div>
        )}
      </div>

      {/* Right panel: thread (hidden on mobile, shown on md+) */}
      <div className="hidden md:flex flex-1 flex-col">
        {selectedConv ? (
          <ConversationThread conversation={selectedConv} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-text-muted">Selectionnez une conversation</p>
          </div>
        )}
      </div>

      <NewConversationDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        members={allMembers}
        currentUserId={user!.id}
        onSelect={handleNewDirect}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create `[id]/page.tsx` — Mobile web conversation view**

```tsx
'use client';

import { useParams } from 'next/navigation';
import { useConversations } from '@keurzen/queries';
import { ConversationThread } from '@/components/messages/ConversationThread';

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { data: conversations = [] } = useConversations();
  const conversation = conversations.find((c) => c.id === id);

  if (!conversation) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <span className="text-sm text-text-muted">Conversation introuvable</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] -mx-4 -my-6 md:-mx-8 md:-my-8">
      <ConversationThread conversation={conversation} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(app)/messages/
git commit -m "feat(web): add messages page with split layout"
```

---

## Task 11: Web Navigation — Add Messages to Sidebar

**Files:**
- Modify: `apps/web/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Add Messages to NAV_ITEMS or HOUSEHOLD_ITEMS**

In `Sidebar.tsx`, add `MessageCircle` to the import:

```typescript
import {
  Home, CheckCircle, Calendar, List,
  Users, Mail, Settings, LogOut, X, MessageCircle,
} from 'lucide-react';
```

Add a Messages entry to `HOUSEHOLD_ITEMS`:

```typescript
const HOUSEHOLD_ITEMS = [
  { href: '/settings/household', icon: Users, label: 'Mon foyer' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/settings/invite', icon: Mail, label: 'Invitations' },
];
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/layout/Sidebar.tsx
git commit -m "feat(web): add Messages link in sidebar navigation"
```

---

## Task 12: Edge Function — Push Notifications

**Files:**
- Create: `apps/mobile/supabase/functions/send-chat-push/index.ts`

- [ ] **Step 1: Create the Edge Function**

```typescript
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
```

- [ ] **Step 2: Deploy the Edge Function**

Run: `cd apps/mobile && npx supabase functions deploy send-chat-push`
Expected: Function deployed successfully.

- [ ] **Step 3: Configure database webhook**

Set up a database webhook in the Supabase Dashboard:
- **Name:** `send-chat-push`
- **Table:** `messages`
- **Events:** `INSERT`
- **Type:** Supabase Edge Function
- **Function:** `send-chat-push`

Note: This step must be done manually in the Supabase Dashboard under Database > Webhooks.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/supabase/functions/send-chat-push/
git commit -m "feat(edge): add send-chat-push Edge Function for messaging notifications"
```

---

## Task 13: Notification Navigation — Handle Push Tap

**Files:**
- Modify: `apps/mobile/src/hooks/usePushNotifications.ts`

- [ ] **Step 1: Add chat_message navigation handler**

In the notification response handler (where it processes `data.type`), add a case for `chat_message`:

```typescript
if (data.type === 'chat_message' && data.conversationId) {
  router.push(`/(app)/messages/${data.conversationId}`);
  return;
}
```

This should be added in the existing `useEffect` that handles `Notifications.addNotificationResponseReceivedListener`.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/hooks/usePushNotifications.ts
git commit -m "feat(mobile): handle chat_message push notification tap navigation"
```

---

## Task 14: Lint & Verify

- [ ] **Step 1: Run lint on mobile**

Run: `cd apps/mobile && npm run lint`
Expected: No errors.

- [ ] **Step 2: Run lint on web**

Run: `cd apps/web && npm run lint`
Expected: No errors.

- [ ] **Step 3: Fix any lint errors**

If lint errors exist, fix them and re-run.

- [ ] **Step 4: Final commit if fixes needed**

```bash
git add -A
git commit -m "fix: lint errors in messaging feature"
```

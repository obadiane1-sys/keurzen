# Messaging Feature — Design Spec

**Date:** 2026-04-06
**Status:** Validated
**Scope:** V1 — Real-time household chat

---

## Overview

Real-time messaging between household members. Two conversation types: one shared household channel (auto-created) and private direct messages between two members. Text-only in V1, with read indicators and push notifications.

**Architecture:** Supabase Realtime (Postgres Changes) — clients subscribe to INSERT events on the `messages` table, filtered by `conversation_id`. RLS ensures security automatically.

---

## Data Model

### Table `conversations`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `household_id` | uuid | FK → `households(id)` ON DELETE CASCADE, NOT NULL |
| `type` | text | NOT NULL, CHECK (`type` IN ('household', 'direct')) |
| `created_by` | uuid | FK → `profiles(id)`, NOT NULL |
| `created_at` | timestamptz | default `now()` |

**Constraints:**
- Unique on `(household_id)` WHERE `type = 'household'` — one household channel per household

**Indexes:**
- `idx_conversations_household` on `(household_id)`

### Table `conversation_members`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `conversation_id` | uuid | FK → `conversations(id)` ON DELETE CASCADE, NOT NULL |
| `user_id` | uuid | FK → `profiles(id)` ON DELETE CASCADE, NOT NULL |
| `last_read_at` | timestamptz | default `now()` |
| `joined_at` | timestamptz | default `now()` |

**Constraints:**
- Unique on `(conversation_id, user_id)`

**Indexes:**
- `idx_conversation_members_user` on `(user_id)`

### Table `messages`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `conversation_id` | uuid | FK → `conversations(id)` ON DELETE CASCADE, NOT NULL |
| `sender_id` | uuid | FK → `profiles(id)`, NOT NULL |
| `content` | text | NOT NULL, CHECK (`length(content) > 0 AND length(content) <= 2000`) |
| `created_at` | timestamptz | default `now()` |

**Indexes:**
- `idx_messages_conversation_created` on `(conversation_id, created_at DESC)` — paginated loading

**No UPDATE or DELETE** — messages are immutable in V1.

### Read Indicator Logic

No separate `read_receipts` table. A message is "seen" by a member if `message.created_at <= conversation_members.last_read_at`. Displayed only under the user's last sent message as "Vu par Marie" or "Vu par Marie, Paul".

---

## RLS Policies

### `conversations`

- **SELECT:** user is a member of the conversation (`EXISTS` in `conversation_members` where `user_id = auth.uid()`)
- **INSERT:** user belongs to the same `household_id` (via `household_members`)
- **UPDATE / DELETE:** none

### `conversation_members`

- **SELECT:** user is a member of the same conversation
- **INSERT:** via RPCs only (auto-added on conversation creation)
- **UPDATE:** only own row (`user_id = auth.uid()`) — for updating `last_read_at`
- **DELETE:** none

### `messages`

- **SELECT:** user is a member of the conversation
- **INSERT:** `sender_id = auth.uid()` AND user is a member of the conversation
- **UPDATE / DELETE:** none in V1

---

## RPCs

### `get_or_create_household_conversation(p_household_id uuid)`

- `SECURITY DEFINER` with `SET search_path = public`
- Uses `auth.uid()` internally — never accepts user_id as parameter
- Creates the household conversation if it doesn't exist
- Adds all current household members as conversation members
- Returns the conversation id
- Idempotent — safe to call multiple times

### `get_or_create_direct_conversation(p_other_user_id uuid)`

- `SECURITY DEFINER` with `SET search_path = public`
- Uses `auth.uid()` internally
- Finds existing direct conversation between the two users, or creates one
- Both users must be in the same household
- Returns the conversation id

---

## Realtime

### Subscription Strategy

Each client subscribes to Postgres Changes (`INSERT`) on `messages` table filtered by `conversation_id`. Subscriptions are established when the user opens the messages screen and maintained while in the messages section.

A lighter subscription for the unread badge count runs at app level (subscribed to all user's conversations) to update the badge in the menu.

### On New Message Received

1. Invalidate `useMessages(conversationId)`
2. Invalidate `useConversations()` (last message preview + unread count)
3. Invalidate `useUnreadCount()` (menu badge)

---

## API Layer (TanStack Query)

### Queries

| Hook | Key | Description |
|---|---|---|
| `useConversations()` | `['conversations']` | List conversations with last message, unread count, member profiles |
| `useMessages(conversationId)` | `['messages', conversationId]` | Infinite query, 30 per page, `created_at DESC`, scroll up to load more |
| `useUnreadCount()` | `['unread-count']` | Total unread messages across all conversations (for menu badge) |

### Mutations

| Hook | Description |
|---|---|
| `useSendMessage()` | Insert message + optimistic update (message appears instantly in the UI) |
| `useMarkAsRead(conversationId)` | Update `last_read_at` on own `conversation_members` row. Called when conversation screen is visible (on mount + on new message while visible) |
| `useCreateDirectConversation(userId)` | Calls `get_or_create_direct_conversation` RPC, navigates to the conversation |

---

## Screens & Navigation

### Access Point

Messages are accessible from the **general menu** (not the tab bar). A badge shows the total unread count on the menu icon.

### Mobile (Expo Router)

| Screen | Route | Description |
|---|---|---|
| Conversation list | `app/(app)/messages/index.tsx` | Household conversation pinned at top (house icon), then DMs sorted by last message. Each row: avatar(s), name, last message truncated, time, unread badge |
| Conversation | `app/(app)/messages/[id].tsx` | Message thread, input at bottom, infinite scroll up. Header shows conversation name + member avatars |

### Web (Next.js)

| Screen | Route | Description |
|---|---|---|
| Conversation list | `app/(app)/messages/page.tsx` | Desktop: split layout (list left, conversation right). Mobile web: same flow as app |
| Conversation | `app/(app)/messages/[id]/page.tsx` | Message thread |

### Components (per platform)

| Component | Role |
|---|---|
| `ConversationListItem` | Row: avatar(s), name, last message truncated, time, unread badge |
| `MessageBubble` | Aligned right if sender, left otherwise. Shows sender name (in household chat) + time |
| `ChatInput` | Text input + send button. Auto-expanding height. Send on Enter (desktop) / send button (mobile) |
| `ReadIndicator` | "Vu par X, Y" under the user's last sent message |

---

## Push Notifications

### Edge Function `send-chat-push`

Triggered by a **database webhook** on `INSERT` into `messages`.

**Logic:**
1. Receive new message payload (`conversation_id`, `sender_id`, `content`)
2. Fetch conversation members (exclude sender)
3. Filter out members with `last_read_at` within last 30 seconds (likely have conversation open)
4. Fetch push tokens for remaining members
5. Check each member's `NotificationPreference.chat_messages` toggle
6. Send push notification:
   - **Title:** sender's `full_name` (household chat) or "Message de {full_name}" (DM)
   - **Body:** content truncated to 100 characters
   - **Data:** `{ conversationId, type: 'chat_message' }` for tap navigation

### Tap Navigation

Tapping the notification opens `/(app)/messages/[id]` with the correct `conversationId`.

### User Preference

New `chat_messages` boolean field added to `notification_preferences` table (default `true`). Toggle available in settings > notifications.

---

## Schema Change to `notification_preferences`

Add column:
```sql
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS chat_messages boolean DEFAULT true;
```

---

## UI Design Guidelines

- Follow existing design tokens from `src/constants/tokens.ts`
- Premium pastel UI: soft bubbles, rounded corners, calm colors
- Sender bubbles: mint-tinted background (tokens.colors.mint with low opacity)
- Other bubbles: white/light gray background
- Unread badge: coral accent (tokens.colors.coral)
- Household conversation icon: house icon with navy color
- Empty state: mascot with friendly message ("Pas encore de messages")
- Touch targets >= 44px on send button and conversation rows
- Message input: soft border, rounded, placeholder "Votre message..."

---

## Out of Scope (V1)

- Image/media attachments
- Message editing or deletion
- Typing indicator
- Message reactions
- Link previews
- Message search
- Conversation muting
- Links to Keurzen entities (tasks, recipes, lists)

These can be added incrementally in future versions.

-- 20260406_create_messaging_tables.sql
-- Messaging feature: conversations, members, messages + RLS + RPCs

-- ─────────────────────────────────────────────
-- 1. conversations
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('household', 'direct')),
  created_by   uuid NOT NULL REFERENCES profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- One household conversation per household (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_household_type
  ON conversations (household_id)
  WHERE type = 'household';

-- Fast lookup by household
CREATE INDEX IF NOT EXISTS idx_conversations_household_id
  ON conversations (household_id);

-- ─────────────────────────────────────────────
-- 2. conversation_members
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversation_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at    timestamptz NOT NULL DEFAULT now(),
  joined_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

-- Fast lookup by user
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id
  ON conversation_members (user_id);

-- ─────────────────────────────────────────────
-- 3. messages
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES profiles(id),
  content         text NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Fast paginated fetch
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages (conversation_id, created_at DESC);

-- ─────────────────────────────────────────────
-- 4. notification_preferences extension
-- ─────────────────────────────────────────────

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS chat_messages boolean NOT NULL DEFAULT true;

-- ─────────────────────────────────────────────
-- 5. RLS — conversations
-- ─────────────────────────────────────────────

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- SELECT: caller must be a member of the conversation
CREATE POLICY "conversations_select_member"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: caller must belong to the target household
CREATE POLICY "conversations_insert_household_member"
  ON conversations FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- 6. RLS — conversation_members
-- ─────────────────────────────────────────────

ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

-- SELECT: caller must be a member of the same conversation
CREATE POLICY "conversation_members_select_peer"
  ON conversation_members FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

-- UPDATE: caller can only update their own row (e.g. last_read_at)
CREATE POLICY "conversation_members_update_own"
  ON conversation_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERT: caller must belong to the household that owns the conversation
CREATE POLICY "conversation_members_insert_household_member"
  ON conversation_members FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN household_members hm ON hm.household_id = c.household_id
      WHERE hm.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- 7. RLS — messages
-- ─────────────────────────────────────────────

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- SELECT: caller must be a member of the conversation
CREATE POLICY "messages_select_member"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

-- INSERT: sender_id must be auth.uid() AND caller must be a conversation member
CREATE POLICY "messages_insert_member"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- 8. RPC: get_or_create_household_conversation
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_or_create_household_conversation(
  p_household_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id      uuid;
  v_conversation_id uuid;
BEGIN
  v_caller_id := auth.uid();

  -- Verify caller belongs to this household
  IF NOT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = p_household_id AND user_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'Not a member of this household';
  END IF;

  -- Try to find existing household conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE household_id = p_household_id AND type = 'household'
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    -- Create the household conversation (handle race condition with unique index)
    BEGIN
      INSERT INTO conversations (household_id, type, created_by)
      VALUES (p_household_id, 'household', v_caller_id)
      RETURNING id INTO v_conversation_id;
    EXCEPTION WHEN unique_violation THEN
      -- Another session created it concurrently — fetch it
      SELECT id INTO v_conversation_id
      FROM conversations
      WHERE household_id = p_household_id AND type = 'household'
      LIMIT 1;
    END;

    -- Add all current household members
    INSERT INTO conversation_members (conversation_id, user_id)
    SELECT v_conversation_id, hm.user_id
    FROM household_members hm
    WHERE hm.household_id = p_household_id
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  ELSE
    -- Conversation already exists — ensure caller is a member (idempotent)
    INSERT INTO conversation_members (conversation_id, user_id)
    VALUES (v_conversation_id, v_caller_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- ─────────────────────────────────────────────
-- 9. RPC: get_or_create_direct_conversation
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
  p_other_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id       uuid;
  v_household_id    uuid;
  v_conversation_id uuid;
BEGIN
  v_caller_id := auth.uid();

  IF v_caller_id = p_other_user_id THEN
    RAISE EXCEPTION 'Cannot create a direct conversation with yourself';
  END IF;

  -- Both users must share the same household
  SELECT hm_caller.household_id INTO v_household_id
  FROM household_members hm_caller
  JOIN household_members hm_other
    ON hm_other.household_id = hm_caller.household_id
   AND hm_other.user_id = p_other_user_id
  WHERE hm_caller.user_id = v_caller_id
  LIMIT 1;

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Users do not share a household';
  END IF;

  -- Find an existing direct conversation between exactly these 2 users
  SELECT cm1.conversation_id INTO v_conversation_id
  FROM conversation_members cm1
  JOIN conversation_members cm2
    ON cm2.conversation_id = cm1.conversation_id
   AND cm2.user_id = p_other_user_id
  JOIN conversations c ON c.id = cm1.conversation_id
  WHERE cm1.user_id = v_caller_id
    AND c.type = 'direct'
    -- Ensure exactly 2 members (no group direct conversations)
    AND (
      SELECT count(*) FROM conversation_members
      WHERE conversation_id = cm1.conversation_id
    ) = 2
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    -- Create new direct conversation
    INSERT INTO conversations (household_id, type, created_by)
    VALUES (v_household_id, 'direct', v_caller_id)
    RETURNING id INTO v_conversation_id;

    -- Add both participants
    INSERT INTO conversation_members (conversation_id, user_id)
    VALUES
      (v_conversation_id, v_caller_id),
      (v_conversation_id, p_other_user_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- ─────────────────────────────────────────────
-- 10. Realtime
-- ─────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

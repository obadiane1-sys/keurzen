-- Account deletion preparation: 4 FKs NO ACTION → ON DELETE SET NULL
-- Anonymizes historical content (messages, meal plan items, conversations)
-- when a user account is deleted, instead of blocking deletion.

-- conversations.created_by (was NOT NULL)
ALTER TABLE conversations ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_created_by_fkey;
ALTER TABLE conversations
  ADD CONSTRAINT conversations_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- meal_plan_items.created_by (was NOT NULL)
ALTER TABLE meal_plan_items ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE meal_plan_items DROP CONSTRAINT IF EXISTS meal_plan_items_created_by_fkey;
ALTER TABLE meal_plan_items
  ADD CONSTRAINT meal_plan_items_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- meal_plan_items.assigned_to (already nullable)
ALTER TABLE meal_plan_items DROP CONSTRAINT IF EXISTS meal_plan_items_assigned_to_fkey;
ALTER TABLE meal_plan_items
  ADD CONSTRAINT meal_plan_items_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL;

-- messages.sender_id (was NOT NULL)
ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages
  ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE SET NULL;

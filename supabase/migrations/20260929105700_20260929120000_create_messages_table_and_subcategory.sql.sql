/*
# Create messages table for realtime chat + add subcategory column to ads

## Purpose
1. Add `subcategory` column to the `ads` table so ads can be organized into
   sub-categories like OLX Pakistan (e.g. Mobiles > Smartphones).
2. Create a new `messages` table for realtime chat between users about specific ads.

## Changes to `ads` table
- ADD COLUMN `subcategory` text (nullable, defaults to NULL) — existing ads keep
  their current data untouched; the new column is optional.

## New table: `messages`
- `id` (uuid PK)
- `sender_id` (uuid, FK to auth.users, NOT NULL) — the user who sent the message
- `receiver_id` (uuid, FK to auth.users, NOT NULL) — the user who receives it
- `ad_id` (uuid, FK to ads, NOT NULL) — the ad being discussed
- `content` (text, NOT NULL) — the message text
- `created_at` (timestamptz, default now())
- `read_at` (timestamptz, nullable) — when the receiver read the message

## Security (RLS)
- `messages` has RLS enabled.
- SELECT: a user can see messages where they are sender or receiver.
- INSERT: only authenticated users can insert; sender_id must be the current user.
- UPDATE: only the receiver can mark a message as read (update read_at).
- DELETE: sender or receiver can delete their own copy of a message.
- Indexes on (receiver_id, created_at) and (ad_id, sender_id, receiver_id) for
  fast conversation listing.

## Important notes
- No existing data is deleted or modified. The `subcategory` column is additive.
- The messages table uses `DEFAULT auth.uid()` on `sender_id` so inserts that
  omit the sender ID still satisfy the INSERT policy.
*/

-- 1. Add subcategory column to ads (additive, no data loss)
ALTER TABLE ads ADD COLUMN IF NOT EXISTS subcategory text;

-- 2. Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id uuid NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Indexes for fast conversation queries
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created ON messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(ad_id, sender_id, receiver_id, created_at DESC);

-- SELECT: sender or receiver can read messages
DROP POLICY IF EXISTS "select_own_messages" ON messages;
CREATE POLICY "select_own_messages"
ON messages FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- INSERT: only sender can send, sender_id must be themselves
DROP POLICY IF EXISTS "insert_own_messages" ON messages;
CREATE POLICY "insert_own_messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- UPDATE: only receiver can mark as read
DROP POLICY IF EXISTS "update_read_messages" ON messages;
CREATE POLICY "update_read_messages"
ON messages FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- DELETE: sender or receiver can delete a message
DROP POLICY IF EXISTS "delete_own_messages" ON messages;
CREATE POLICY "delete_own_messages"
ON messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
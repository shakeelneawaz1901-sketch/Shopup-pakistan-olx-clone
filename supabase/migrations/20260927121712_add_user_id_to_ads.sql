/*
# Add user_id to ads table for user accounts

1. Modified Tables
- `ads`
  - Added `user_id` (uuid, nullable, references auth.users) to track who posted each ad.
    Nullable so existing rows are preserved. New inserts default to auth.uid()
    via the INSERT policy + frontend, so logged-in users' ads are automatically
    tagged with their account.

2. Security Changes
- SELECT policy: kept public (anon + authenticated) so anyone can browse ads
  even without logging in.
- INSERT policy: changed from anon-allowed to authenticated-only, with
  WITH CHECK (auth.uid() = user_id). This enforces "must be logged in to post".
  The column has DEFAULT auth.uid() so the frontend insert can omit user_id.
- UPDATE policy: changed to owner-only (authenticated, auth.uid() = user_id).
- DELETE policy: changed to owner-only (authenticated, auth.uid() = user_id).
*/

ALTER TABLE ads
  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL;

-- SELECT stays public (browse without login)
DROP POLICY IF EXISTS "anon_select_ads" ON ads;
CREATE POLICY "anon_select_ads" ON ads FOR SELECT
  TO anon, authenticated USING (true);

-- INSERT: authenticated only, must own the ad
DROP POLICY IF EXISTS "anon_insert_ads" ON ads;
DROP POLICY IF EXISTS "authenticated_insert_ads" ON ads;
CREATE POLICY "authenticated_insert_ads" ON ads FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- UPDATE: owner only
DROP POLICY IF EXISTS "anon_update_ads" ON ads;
DROP POLICY IF EXISTS "owner_update_ads" ON ads;
CREATE POLICY "owner_update_ads" ON ads FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE: owner only
DROP POLICY IF EXISTS "anon_delete_ads" ON ads;
DROP POLICY IF EXISTS "owner_delete_ads" ON ads;
CREATE POLICY "owner_delete_ads" ON ads FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

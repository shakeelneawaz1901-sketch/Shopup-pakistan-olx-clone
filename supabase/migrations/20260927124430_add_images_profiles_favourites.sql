/*
# Add multi-image support, profiles, and favourites

1. Modified Tables
- `ads`
  - Added `images` (text[], nullable) — array of image URLs for up to 5 photos per ad.
    The old `image_url` column is kept for backwards compatibility; new inserts
    populate both `image_url` (first image) and `images` (full array).

2. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users) — linked to the user account
  - `full_name` (text) — user's display name
  - `phone` (text) — phone number
  - `avatar_url` (text) — public URL of avatar image in 'avatars' bucket
  - `created_at` (timestamptz)
  - Publicly readable (anyone can see seller profiles), only owner can insert/update/delete.

- `favourites`
  - `id` (uuid, primary key, auto-generated)
  - `user_id` (uuid, references auth.users) — who favourited
  - `ad_id` (uuid, references ads) — which ad was favourited
  - `created_at` (timestamptz)
  - Owner-scoped: each authenticated user can only see/manage their own favourites.
  - Unique constraint on (user_id, ad_id) to prevent duplicate favourites.

3. New Storage Bucket
- `avatars` (public) — for user profile photos

4. Security
- RLS enabled on `profiles` and `favourites`.
- profiles: SELECT public (anon + authenticated), INSERT/UPDATE/DELETE owner-only.
- favourites: all operations owner-only (authenticated, auth.uid() = user_id).
- avatars bucket: public read, authenticated write.
*/

-- Add images array column to ads
ALTER TABLE ads ADD COLUMN IF NOT EXISTS images text[];

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  phone text DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_profiles" ON profiles;
CREATE POLICY "public_select_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owner_insert_profile" ON profiles;
CREATE POLICY "owner_insert_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "owner_update_profile" ON profiles;
CREATE POLICY "owner_update_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "owner_delete_profile" ON profiles;
CREATE POLICY "owner_delete_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Favourites table
CREATE TABLE IF NOT EXISTS favourites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id uuid NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, ad_id)
);

ALTER TABLE favourites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_select_favourites" ON favourites;
CREATE POLICY "owner_select_favourites" ON favourites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_insert_favourite" ON favourites;
CREATE POLICY "owner_insert_favourite" ON favourites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_delete_favourite" ON favourites;
CREATE POLICY "owner_delete_favourite" ON favourites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Avatars storage bucket (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_avatars" ON storage.objects;
CREATE POLICY "public_read_avatars" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "auth_insert_avatars" ON storage.objects;
CREATE POLICY "auth_insert_avatars" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "auth_update_avatars" ON storage.objects;
CREATE POLICY "auth_update_avatars" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "auth_delete_avatars" ON storage.objects;
CREATE POLICY "auth_delete_avatars" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'avatars');

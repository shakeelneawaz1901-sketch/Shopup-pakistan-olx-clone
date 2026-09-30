/*
# Create ads table for ShopUp Pakistan (single-tenant, no auth)

1. New Tables
- `ads`
  - `id` (uuid, primary key, auto-generated)
  - `title` (text, not null) - ad title
  - `price` (numeric, not null) - price in PKR
  - `city` (text, not null) - city where item is located
  - `category` (text, not null) - item category
  - `phone` (text, not null) - seller contact number
  - `description` (text) - item description
  - `image_url` (text) - public URL of uploaded image
  - `latitude` (double precision) - geolocation latitude
  - `longitude` (double precision) - geolocation longitude
  - `created_at` (timestamptz, default now()) - when ad was posted

2. Indexes
- Index on `city` for city-based filtering
- Index on `category` for category-based filtering
- Index on `created_at` (desc) for newest-first ordering

3. Security
- Enable RLS on `ads`.
- Allow anon + authenticated full CRUD because the app is intentionally
  public/community (single-tenant, no sign-in screen). Anyone can browse
  and post ads, matching the OLX/ShopUp use case.
*/

CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  city text NOT NULL,
  category text NOT NULL,
  phone text NOT NULL,
  description text DEFAULT '',
  image_url text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ads_city_idx ON ads (city);
CREATE INDEX IF NOT EXISTS ads_category_idx ON ads (category);
CREATE INDEX IF NOT EXISTS ads_created_at_idx ON ads (created_at DESC);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ads" ON ads;
CREATE POLICY "anon_select_ads" ON ads FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ads" ON ads;
CREATE POLICY "anon_insert_ads" ON ads FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ads" ON ads;
CREATE POLICY "anon_update_ads" ON ads FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ads" ON ads;
CREATE POLICY "anon_delete_ads" ON ads FOR DELETE
  TO anon, authenticated USING (true);

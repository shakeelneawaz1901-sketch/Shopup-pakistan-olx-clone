-- Add show_phone boolean column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_phone boolean NOT NULL DEFAULT true;

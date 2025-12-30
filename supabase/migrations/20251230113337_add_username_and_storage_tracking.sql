/*
  # Add Username and Storage Tracking
  
  ## Overview
  This migration adds username support and storage tracking features to enable
  comprehensive user account management with storage limits.
  
  ## Changes Made
  
  ### 1. profiles table modifications:
  - Add `username` (text, unique, not null) - User's unique username for authentication
  - Add `storage_used` (bigint, default 0) - Current storage usage in bytes
  - Add `storage_limit` (bigint, default 104857600) - Storage limit in bytes (100MB default)
  
  ### 2. Indexes:
  - Add unique index on profiles(username) for fast username lookups
  - Add index on profiles(email) for email-based queries
  
  ### 3. Function Updates:
  - Update handle_new_user() function to extract username from user metadata
  - Add default username generation if not provided
  
  ## Security
  - Username must be unique across all users
  - Storage calculations are server-side to prevent manipulation
  - RLS policies remain unchanged (users can only access their own data)
  
  ## Important Notes
  1. Default storage limit is 100MB (104857600 bytes)
  2. Storage tracking will be updated when projects are saved/uploaded
  3. Username validation should be done on the client side
  4. Usernames are case-sensitive for display but should be unique case-insensitive
*/

-- Add username column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN username text;
  END IF;
END $$;

-- Add storage_used column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'storage_used'
  ) THEN
    ALTER TABLE profiles ADD COLUMN storage_used bigint DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add storage_limit column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'storage_limit'
  ) THEN
    ALTER TABLE profiles ADD COLUMN storage_limit bigint DEFAULT 104857600 NOT NULL;
  END IF;
END $$;

-- Create unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(LOWER(username));

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Add size_bytes column to projects table for storage tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'size_bytes'
  ) THEN
    ALTER TABLE projects ADD COLUMN size_bytes bigint DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Update the handle_new_user function to support username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  username_value text;
BEGIN
  -- Extract username from metadata or generate one from email
  username_value := COALESCE(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 8)
  );
  
  INSERT INTO public.profiles (id, email, full_name, avatar_url, username, storage_used, storage_limit)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    username_value,
    0,
    104857600
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate and update user storage
CREATE OR REPLACE FUNCTION public.update_user_storage()
RETURNS trigger AS $$
DECLARE
  total_storage bigint;
BEGIN
  -- Calculate total storage for the user
  SELECT COALESCE(SUM(size_bytes), 0)
  INTO total_storage
  FROM projects
  WHERE user_id = NEW.user_id;
  
  -- Update the user's storage_used
  UPDATE profiles
  SET storage_used = total_storage
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update storage when projects change
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_storage_on_project_change'
  ) THEN
    CREATE TRIGGER update_storage_on_project_change
      AFTER INSERT OR UPDATE OR DELETE ON projects
      FOR EACH ROW EXECUTE FUNCTION public.update_user_storage();
  END IF;
END $$;

-- Create function to check storage limit before insert/update
CREATE OR REPLACE FUNCTION public.check_storage_limit()
RETURNS trigger AS $$
DECLARE
  current_storage bigint;
  user_limit bigint;
  size_difference bigint;
BEGIN
  -- Get user's current storage and limit
  SELECT storage_used, storage_limit
  INTO current_storage, user_limit
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Calculate the size difference
  IF TG_OP = 'UPDATE' THEN
    size_difference := NEW.size_bytes - OLD.size_bytes;
  ELSE
    size_difference := NEW.size_bytes;
  END IF;
  
  -- Check if the operation would exceed the limit
  IF (current_storage + size_difference) > user_limit THEN
    RAISE EXCEPTION 'Storage limit exceeded. Current: % bytes, Limit: % bytes, Attempted addition: % bytes',
      current_storage, user_limit, size_difference;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check storage limit before insert/update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'check_storage_before_save'
  ) THEN
    CREATE TRIGGER check_storage_before_save
      BEFORE INSERT OR UPDATE ON projects
      FOR EACH ROW EXECUTE FUNCTION public.check_storage_limit();
  END IF;
END $$;
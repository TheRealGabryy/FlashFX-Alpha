/*
  # Fix Username Registration Issues
  
  ## Overview
  This migration fixes registration issues related to username conflicts and
  improves the user registration flow.
  
  ## Changes Made
  
  ### 1. Update handle_new_user function:
  - Add better error handling for username conflicts
  - Make username nullable to avoid registration failures
  - Handle username generation more robustly
  
  ### 2. Update username constraint:
  - Ensure username can be null during initial registration
  - Add unique constraint only on non-null usernames
  
  ## Important Notes
  1. Users can complete registration even if username is temporarily unavailable
  2. Username will be auto-generated if not provided
  3. Users can update username later through profile settings
*/

-- Drop the existing unique index on username
DROP INDEX IF EXISTS idx_profiles_username;

-- Make username nullable initially
DO $$
BEGIN
  ALTER TABLE profiles ALTER COLUMN username DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create a unique partial index on username (only for non-null usernames)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique 
  ON profiles(LOWER(username)) 
  WHERE username IS NOT NULL;

-- Update the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  username_value text;
  base_username text;
  counter integer := 0;
  max_attempts integer := 10;
BEGIN
  -- Try to extract username from metadata
  username_value := new.raw_user_meta_data->>'username';
  
  -- If username is provided, try to use it
  IF username_value IS NOT NULL AND username_value != '' THEN
    -- Check if username already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(username_value)) THEN
      -- Username taken, generate alternative
      base_username := split_part(new.email, '@', 1);
      LOOP
        EXIT WHEN counter >= max_attempts;
        username_value := base_username || '_' || substr(new.id::text, 1, 4 + counter);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(username_value));
        counter := counter + 1;
      END LOOP;
    END IF;
  ELSE
    -- Generate username from email
    base_username := split_part(new.email, '@', 1);
    username_value := base_username || '_' || substr(new.id::text, 1, 8);
    
    -- Ensure uniqueness
    counter := 0;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(username_value)) AND counter < max_attempts LOOP
      counter := counter + 1;
      username_value := base_username || '_' || substr(new.id::text, 1, 4 + counter);
    END LOOP;
  END IF;
  
  -- Insert profile
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
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        username = COALESCE(EXCLUDED.username, profiles.username);
  
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- If still a conflict, insert without username and let user set it later
    INSERT INTO public.profiles (id, email, full_name, avatar_url, username, storage_used, storage_limit)
    VALUES (
      new.id,
      new.email,
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'avatar_url',
      NULL,
      0,
      104857600
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
  WHEN OTHERS THEN
    -- Log error but don't fail the registration
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
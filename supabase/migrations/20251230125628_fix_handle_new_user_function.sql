/*
  # Fix User Registration Function

  ## Overview
  Updates the handle_new_user trigger function to match the current profiles table schema.

  ## Changes
  1. Function Updates
    - Remove references to removed columns (full_name, avatar_url)
    - Keep only active columns: id, email, username, storage_used, storage_limit
    - Maintain username conflict resolution logic
    - Preserve error handling and retry logic

  ## Important Notes
  - This function creates a profile entry when a new user signs up
  - Default storage limit is 100 MB (104857600 bytes)
  - Default storage used is 0 bytes
  - Username conflicts are automatically resolved with unique suffixes
*/

-- Update the handle_new_user function to match current schema
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
  
  -- Insert profile with only existing columns
  INSERT INTO public.profiles (id, email, username, storage_used, storage_limit)
  VALUES (
    new.id,
    new.email,
    username_value,
    0,
    104857600
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        username = COALESCE(EXCLUDED.username, profiles.username),
        storage_used = COALESCE(EXCLUDED.storage_used, profiles.storage_used),
        storage_limit = COALESCE(EXCLUDED.storage_limit, profiles.storage_limit);
  
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- If still a conflict, insert without username and let user set it later
    INSERT INTO public.profiles (id, email, username, storage_used, storage_limit)
    VALUES (
      new.id,
      new.email,
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
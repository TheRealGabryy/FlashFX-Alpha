/*
  # Add Unique Constraint to Profiles Email

  ## Overview
  This migration adds a unique constraint to the email column in the profiles table
  to ensure data integrity and prevent duplicate email entries.

  ## Changes
  1. Add UNIQUE constraint to profiles.email column
  
  ## Security
  - No RLS changes required
  - Constraint ensures email uniqueness at database level
  
  ## Important Notes
  - This migration uses DO block to add constraint only if it doesn't exist
  - Prevents errors if migration is run multiple times
  - Email uniqueness is critical for user identification and security
*/

-- Add unique constraint to profiles.email if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'profiles_email_key' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END $$;
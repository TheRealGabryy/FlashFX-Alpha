/*
  # Restore Storage Tracking Columns

  ## Overview
  Adds back storage tracking columns to the profiles table to enable project storage management.

  ## Changes
  1. Columns Added
    - `storage_used` (bigint): Tracks current storage usage in bytes
    - `storage_limit` (bigint): Maximum storage allowed in bytes (default 100 MB)

  ## Details
  - Default storage limit: 104857600 bytes (100 MB)
  - Default storage used: 0 bytes
  - Columns set to NOT NULL with default values for data integrity
  
  ## Important Notes
  - These columns are essential for the StorageService to function properly
  - Storage is calculated based on project data size
  - Users cannot exceed their storage limit when creating/updating projects
*/

-- Add storage_used column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'storage_used'
  ) THEN
    ALTER TABLE profiles ADD COLUMN storage_used BIGINT NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add storage_limit column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'storage_limit'
  ) THEN
    ALTER TABLE profiles ADD COLUMN storage_limit BIGINT NOT NULL DEFAULT 104857600;
  END IF;
END $$;

-- Create index for storage queries if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'profiles' AND indexname = 'idx_profiles_storage'
  ) THEN
    CREATE INDEX idx_profiles_storage ON profiles(storage_used, storage_limit);
  END IF;
END $$;
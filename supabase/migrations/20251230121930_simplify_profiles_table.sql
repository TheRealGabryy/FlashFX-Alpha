/*
  # Simplify Profiles Table
  
  ## Changes
  1. Remove avatar_url column
  2. Remove full_name column  
  3. Remove storage tracking columns
  4. Keep only essential fields: id, email, username
  
  ## Tables Modified
  - profiles: Simplified to essential fields only
*/

-- Remove avatar_url column
ALTER TABLE profiles DROP COLUMN IF EXISTS avatar_url;

-- Remove full_name column
ALTER TABLE profiles DROP COLUMN IF EXISTS full_name;

-- Remove storage tracking columns
ALTER TABLE profiles DROP COLUMN IF EXISTS storage_used;
ALTER TABLE profiles DROP COLUMN IF EXISTS storage_limit;
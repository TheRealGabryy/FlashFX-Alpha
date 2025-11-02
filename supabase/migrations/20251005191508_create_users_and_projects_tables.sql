/*
  # User Management and Projects Schema

  ## Overview
  This migration sets up the core database schema for user management and project storage.
  It creates tables for storing user profiles and their design projects.

  ## New Tables
  
  ### `profiles`
  Extends Supabase auth.users with additional user information:
  - `id` (uuid, primary key) - References auth.users(id)
  - `email` (text) - User's email address
  - `full_name` (text, nullable) - User's display name
  - `avatar_url` (text, nullable) - Profile picture URL
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `projects`
  Stores user design projects:
  - `id` (uuid, primary key) - Unique project identifier
  - `user_id` (uuid, foreign key) - References profiles(id)
  - `name` (text) - Project name
  - `description` (text, nullable) - Project description
  - `data` (jsonb) - Complete project data (canvas elements, settings, etc.)
  - `thumbnail` (text, nullable) - Project preview image URL
  - `created_at` (timestamptz) - Project creation timestamp
  - `updated_at` (timestamptz) - Last modification timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - RLS is enabled on both tables
  - Users can only access their own profile data
  - Users can only access their own projects
  - All policies require authentication
  
  ### Policies
  
  #### profiles table:
  - SELECT: Users can view their own profile
  - INSERT: Users can create their own profile
  - UPDATE: Users can update their own profile
  - DELETE: Users can delete their own profile
  
  #### projects table:
  - SELECT: Users can view their own projects
  - INSERT: Users can create projects for themselves
  - UPDATE: Users can update their own projects
  - DELETE: Users can delete their own projects

  ## Indexes
  - Index on projects(user_id) for efficient project retrieval by user
  - Index on projects(updated_at) for sorting by recent activity

  ## Important Notes
  1. The profiles table is automatically populated via a trigger when a new user signs up
  2. Projects data is stored as JSONB for flexibility
  3. All timestamps use timestamptz for proper timezone handling
  4. Cascading deletes ensure data integrity when users are deleted
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Project',
  description text,
  data jsonb NOT NULL DEFAULT '{}',
  thumbnail text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_profiles'
  ) THEN
    CREATE TRIGGER set_updated_at_profiles
      BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- Create triggers for updated_at on projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_projects'
  ) THEN
    CREATE TRIGGER set_updated_at_projects
      BEFORE UPDATE ON projects
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;
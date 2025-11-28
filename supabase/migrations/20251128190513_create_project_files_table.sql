/*
  # Create Project Files Table for Cloud Storage

  1. New Tables
    - `project_files`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `project_name` (text)
      - `description` (text, nullable)
      - `file_data` (bytea) - Binary .ffxproj file data
      - `file_size` (bigint) - Size in bytes
      - `thumbnail` (text, nullable) - Base64 thumbnail
      - `schema_version` (integer) - Project file schema version
      - `element_count` (integer) - Number of elements
      - `animation_count` (integer) - Number of animations
      - `tags` (text array, nullable)
      - `is_public` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `project_files` table
    - Add policy for users to read their own project files
    - Add policy for users to create their own project files
    - Add policy for users to update their own project files
    - Add policy for users to delete their own project files
    - Add policy for public projects to be readable by anyone

  3. Indexes
    - Index on user_id for fast user project queries
    - Index on created_at for sorting
    - Index on is_public for public project discovery
*/

CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_name text NOT NULL,
  description text,
  file_data bytea NOT NULL,
  file_size bigint NOT NULL,
  thumbnail text,
  schema_version integer NOT NULL DEFAULT 1,
  element_count integer NOT NULL DEFAULT 0,
  animation_count integer NOT NULL DEFAULT 0,
  tags text[],
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own project files"
  ON project_files
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read public project files"
  ON project_files
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can create own project files"
  ON project_files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project files"
  ON project_files
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project files"
  ON project_files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_project_files_user_id ON project_files(user_id);
CREATE INDEX IF NOT EXISTS idx_project_files_created_at ON project_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_files_is_public ON project_files(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_project_files_tags ON project_files USING gin(tags);

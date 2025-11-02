/*
  # Create Presets Table

  1. New Tables
    - `presets`
      - `id` (uuid, primary key) - Unique identifier for the preset
      - `user_id` (uuid, foreign key) - Reference to the user who created the preset
      - `name` (text) - Name of the preset
      - `description` (text, optional) - Description of the preset
      - `elements` (jsonb) - JSON array of design elements in the preset group
      - `thumbnail` (text, optional) - Base64 or URL for preset preview thumbnail
      - `element_count` (integer) - Number of elements in the preset
      - `created_at` (timestamptz) - When the preset was created
      - `updated_at` (timestamptz) - When the preset was last updated

  2. Security
    - Enable RLS on `presets` table
    - Add policy for users to read their own presets
    - Add policy for users to create their own presets
    - Add policy for users to update their own presets
    - Add policy for users to delete their own presets

  3. Indexes
    - Index on user_id for faster preset lookups per user
    - Index on created_at for sorting

  4. Notes
    - Presets are user-specific and can be exported/imported via JSON
    - The elements field stores the complete group structure
    - Element count is stored for quick display without parsing JSON
*/

CREATE TABLE IF NOT EXISTS presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  thumbnail text,
  element_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own presets"
  ON presets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own presets"
  ON presets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presets"
  ON presets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own presets"
  ON presets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_presets_user_id ON presets(user_id);
CREATE INDEX IF NOT EXISTS idx_presets_created_at ON presets(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER presets_updated_at
  BEFORE UPDATE ON presets
  FOR EACH ROW
  EXECUTE FUNCTION update_presets_updated_at();

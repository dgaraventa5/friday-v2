-- Migration: Add timezone column to profiles
-- This allows server-side code to calculate "today" in the user's timezone

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Los_Angeles';

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.timezone IS 'User timezone for date calculations (e.g., America/Los_Angeles, America/New_York)';

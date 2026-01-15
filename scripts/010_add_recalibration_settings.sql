-- Migration: Add recalibration preferences to profiles
-- These settings control the Daily Recalibration feature

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS recalibration_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS recalibration_time TIME DEFAULT '17:00',
  ADD COLUMN IF NOT EXISTS recalibration_include_tomorrow BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.recalibration_enabled IS 'Master toggle for auto-prompt recalibration modal';
COMMENT ON COLUMN public.profiles.recalibration_time IS 'Local time to trigger recalibration prompt (default 5 PM)';
COMMENT ON COLUMN public.profiles.recalibration_include_tomorrow IS 'Include tomorrow tasks in recalibration review';

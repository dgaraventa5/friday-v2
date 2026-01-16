-- Migration: Add recalibration dismissed date to profiles (cross-device tracking)
-- This replaces localStorage-based tracking to sync dismissal across all devices

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS recalibration_last_dismissed_date DATE DEFAULT NULL;

COMMENT ON COLUMN public.profiles.recalibration_last_dismissed_date IS
  'Date when user last dismissed the recalibration modal (synced across devices)';

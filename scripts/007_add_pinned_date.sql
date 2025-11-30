-- Migration: Add pinned_date column to tasks table
-- This column tracks when a task has been manually scheduled to a specific date.
-- The scheduling algorithm will respect this pin for the current day only,
-- allowing fresh rescheduling to occur each new day.

ALTER TABLE tasks
ADD COLUMN pinned_date DATE DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN tasks.pinned_date IS 'Date when task was manually pinned/pulled to a specific day. Algorithm respects this only for the current day.';


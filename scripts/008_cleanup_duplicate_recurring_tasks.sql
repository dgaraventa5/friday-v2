-- Cleanup duplicate recurring task instances
-- This script removes duplicate recurring tasks, keeping only the oldest instance
-- per (recurring_series_id, start_date) combination

-- First, let's see how many duplicates exist (run this to preview)
-- SELECT 
--   recurring_series_id,
--   start_date,
--   COUNT(*) as duplicate_count,
--   array_agg(id ORDER BY created_at) as task_ids
-- FROM tasks
-- WHERE is_recurring = true 
--   AND recurring_series_id IS NOT NULL
--   AND completed = false
-- GROUP BY recurring_series_id, start_date
-- HAVING COUNT(*) > 1;

-- Delete duplicate recurring task instances, keeping the oldest one
DELETE FROM tasks
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY recurring_series_id, start_date
        ORDER BY created_at ASC
      ) as rn
    FROM tasks
    WHERE is_recurring = true 
      AND recurring_series_id IS NOT NULL
  ) t
  WHERE rn > 1
);

-- Verify cleanup was successful (should return 0 rows)
-- SELECT 
--   recurring_series_id,
--   start_date,
--   COUNT(*) as count
-- FROM tasks
-- WHERE is_recurring = true 
--   AND recurring_series_id IS NOT NULL
-- GROUP BY recurring_series_id, start_date
-- HAVING COUNT(*) > 1;


-- Fix non-recurring tasks that have incorrect start_dates

-- Find and fix non-recurring tasks where start_date doesn't match due_date
-- This happens when tasks were created with timezone issues

DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Update non-recurring tasks to have start_date = due_date
  UPDATE tasks
  SET start_date = due_date,
      updated_at = NOW()
  WHERE is_recurring = false
    AND start_date IS NOT NULL
    AND start_date != due_date
    AND completed = false;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  RAISE NOTICE 'Fixed % non-recurring tasks with mismatched dates', affected_count;
  
  -- Also fix any tasks that have no start_date but should
  UPDATE tasks
  SET start_date = due_date,
      updated_at = NOW()
  WHERE is_recurring = false
    AND start_date IS NULL
    AND due_date IS NOT NULL
    AND completed = false;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  RAISE NOTICE 'Added start_date to % non-recurring tasks', affected_count;
END $$;

-- Show results
SELECT 
  id,
  title,
  category,
  due_date,
  start_date,
  is_recurring,
  completed,
  CASE 
    WHEN is_recurring THEN 'Recurring (OK)'
    WHEN start_date = due_date THEN 'Fixed'
    ELSE 'Needs Review'
  END as status
FROM tasks
WHERE completed = false
ORDER BY start_date, due_date;

-- Fix existing recurring tasks that have incorrect day-of-week due to timezone issues
-- This script adjusts dates that don't match their intended recurring_days

DO $$
DECLARE
  task_record RECORD;
  intended_day INTEGER;
  actual_day INTEGER;
  adjusted_date DATE;
BEGIN
  -- Loop through all recurring weekly tasks
  FOR task_record IN 
    SELECT id, due_date, start_date, recurring_days, title
    FROM tasks
    WHERE is_recurring = true 
    AND recurring_interval = 'weekly'
    AND recurring_days IS NOT NULL
  LOOP
    -- Get the day of week for the current due_date (0 = Sunday, 6 = Saturday)
    actual_day := EXTRACT(DOW FROM task_record.due_date::timestamp);
    
    -- Check if the actual day matches any of the intended recurring_days
    IF NOT (actual_day = ANY(task_record.recurring_days)) THEN
      -- Day doesn't match - likely shifted by timezone
      -- Assume it shifted backward by 1 day, so add 1 day
      adjusted_date := task_record.due_date + INTERVAL '1 day';
      
      RAISE NOTICE 'Fixing task "%" - was scheduled for day % (%), adjusting to %', 
        task_record.title, 
        actual_day,
        task_record.due_date,
        adjusted_date;
      
      -- Update both due_date and start_date
      UPDATE tasks
      SET 
        due_date = adjusted_date,
        start_date = adjusted_date
      WHERE id = task_record.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Recurring task date fix completed';
END $$;

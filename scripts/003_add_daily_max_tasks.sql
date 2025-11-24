-- Add daily_max_tasks field to profiles table
-- This allows users to configure the maximum number of tasks per day (weekday/weekend)
-- Default is 4 tasks per day for both weekday and weekend

alter table public.profiles
  add column if not exists daily_max_tasks jsonb default '{"weekday": 4, "weekend": 4}'::jsonb;

-- Update existing profiles to have the default value if they don't have it yet
update public.profiles
set daily_max_tasks = '{"weekday": 4, "weekend": 4}'::jsonb
where daily_max_tasks is null;


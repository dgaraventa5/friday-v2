-- Add Eisenhower Matrix fields to tasks table
alter table public.tasks 
  add column if not exists importance text check (importance in ('important', 'not-important')) default 'not-important',
  add column if not exists urgency text check (urgency in ('urgent', 'not-urgent')) default 'not-urgent',
  add column if not exists estimated_hours decimal(5,2) default 1.0,
  add column if not exists start_date date,
  add column if not exists category text check (category in ('Work', 'Home', 'Health', 'Personal')) default 'Personal';

-- Add recurring task fields
alter table public.tasks 
  add column if not exists recurring_series_id uuid,
  add column if not exists is_recurring boolean default false,
  add column if not exists recurring_interval text check (recurring_interval in ('daily', 'weekly', 'monthly')),
  add column if not exists recurring_days integer[],
  add column if not exists recurring_end_type text check (recurring_end_type in ('never', 'after')),
  add column if not exists recurring_end_count integer,
  add column if not exists recurring_current_count integer default 1;

-- Add indexes for new fields
create index if not exists tasks_start_date_idx on public.tasks(start_date);
create index if not exists tasks_category_idx on public.tasks(category);
create index if not exists tasks_recurring_series_id_idx on public.tasks(recurring_series_id);
create index if not exists tasks_importance_urgency_idx on public.tasks(importance, urgency);

-- Add streak tracking and limits to profiles
alter table public.profiles
  add column if not exists current_streak integer default 0,
  add column if not exists longest_streak integer default 0,
  add column if not exists last_completion_date date,
  add column if not exists category_limits jsonb default '{"Work": {"weekday": 10, "weekend": 2}, "Home": {"weekday": 4, "weekend": 6}, "Health": {"weekday": 2, "weekend": 3}, "Personal": {"weekday": 2, "weekend": 4}}'::jsonb,
  add column if not exists daily_max_hours jsonb default '{"weekday": 10, "weekend": 6}'::jsonb,
  add column if not exists onboarding_completed boolean default false;

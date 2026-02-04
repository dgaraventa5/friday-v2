-- Migration: Add user_id to reminder_completions
-- This fixes silent failures when RLS policies use subqueries to the parent reminders table
-- and auth.uid() returns null due to session context issues.

-- 1. Add user_id column (nullable initially for backfill)
ALTER TABLE public.reminder_completions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Backfill existing rows from parent reminders table
UPDATE public.reminder_completions rc
SET user_id = r.user_id
FROM public.reminders r
WHERE rc.reminder_id = r.id
  AND rc.user_id IS NULL;

-- 3. Make NOT NULL after backfill
ALTER TABLE public.reminder_completions
  ALTER COLUMN user_id SET NOT NULL;

-- 4. Drop old RLS policies that use subqueries
DROP POLICY IF EXISTS "reminder_completions_select_own" ON public.reminder_completions;
DROP POLICY IF EXISTS "reminder_completions_insert_own" ON public.reminder_completions;
DROP POLICY IF EXISTS "reminder_completions_update_own" ON public.reminder_completions;
DROP POLICY IF EXISTS "reminder_completions_delete_own" ON public.reminder_completions;

-- 5. Create new direct RLS policies (simpler, more reliable)
CREATE POLICY "reminder_completions_select_own" ON public.reminder_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reminder_completions_insert_own" ON public.reminder_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reminder_completions_update_own" ON public.reminder_completions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "reminder_completions_delete_own" ON public.reminder_completions
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Add index for performance
CREATE INDEX IF NOT EXISTS reminder_completions_user_id_idx ON public.reminder_completions(user_id);

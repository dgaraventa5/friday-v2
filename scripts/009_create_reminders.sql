-- Create reminders table
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  time_label TIME,
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
  recurrence_interval INTEGER NOT NULL DEFAULT 1,
  recurrence_days INTEGER[],
  monthly_type TEXT CHECK (monthly_type IN ('day_of_month', 'nth_weekday')),
  monthly_week_position INTEGER,
  end_type TEXT NOT NULL DEFAULT 'never' CHECK (end_type IN ('never', 'after')),
  end_count INTEGER,
  current_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create reminder_completions table
CREATE TABLE public.reminder_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'skipped')),
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reminder_id, completion_date)
);

-- Enable RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for reminders
CREATE POLICY "reminders_select_own" ON public.reminders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reminders_insert_own" ON public.reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reminders_update_own" ON public.reminders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reminders_delete_own" ON public.reminders
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for reminder_completions (via reminder ownership)
CREATE POLICY "reminder_completions_select_own" ON public.reminder_completions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.reminders WHERE id = reminder_id AND user_id = auth.uid())
  );
CREATE POLICY "reminder_completions_insert_own" ON public.reminder_completions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.reminders WHERE id = reminder_id AND user_id = auth.uid())
  );
CREATE POLICY "reminder_completions_update_own" ON public.reminder_completions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.reminders WHERE id = reminder_id AND user_id = auth.uid())
  );
CREATE POLICY "reminder_completions_delete_own" ON public.reminder_completions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.reminders WHERE id = reminder_id AND user_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX reminders_user_id_idx ON public.reminders(user_id);
CREATE INDEX reminders_is_active_idx ON public.reminders(is_active);
CREATE INDEX reminder_completions_reminder_id_idx ON public.reminder_completions(reminder_id);
CREATE INDEX reminder_completions_date_idx ON public.reminder_completions(completion_date);

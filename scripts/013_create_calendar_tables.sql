-- Calendar Integration Migration
-- Creates tables for calendar connections and cached events

-- Create connected_calendars table
CREATE TABLE public.connected_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot TEXT NOT NULL CHECK (slot IN ('personal', 'work', 'birthdays')),
  connection_type TEXT NOT NULL CHECK (connection_type IN ('google', 'ical_url')),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6', -- Default blue hex color

  -- Google OAuth fields
  google_account_id TEXT,
  google_account_email TEXT,
  google_calendar_id TEXT,
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_token_expiry TIMESTAMPTZ,

  -- iCal URL fields
  ical_url TEXT,

  -- Sync status
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Each user can only have one calendar per slot
  UNIQUE(user_id, slot)
);

-- Create calendar_events table (cached events from external calendars)
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES public.connected_calendars(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- ID from source calendar (Google event ID, iCal UID)
  title TEXT NOT NULL,
  description TEXT,

  -- Time fields (stored as TIMESTAMPTZ for proper timezone handling)
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT false,

  -- Event metadata
  status TEXT NOT NULL DEFAULT 'busy' CHECK (status IN ('busy', 'free', 'tentative')),
  location TEXT,
  event_url TEXT, -- Link to open in source calendar

  -- Birthday detection
  is_birthday BOOLEAN DEFAULT false,
  birthday_contact_name TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate events from same source
  UNIQUE(calendar_id, external_id)
);

-- Add calendar source fields to reminders table
ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'calendar')),
  ADD COLUMN IF NOT EXISTS source_event_id UUID REFERENCES public.calendar_events(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.connected_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for connected_calendars
CREATE POLICY "connected_calendars_select_own" ON public.connected_calendars
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "connected_calendars_insert_own" ON public.connected_calendars
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "connected_calendars_update_own" ON public.connected_calendars
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "connected_calendars_delete_own" ON public.connected_calendars
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for calendar_events (via calendar ownership)
CREATE POLICY "calendar_events_select_own" ON public.calendar_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.connected_calendars WHERE id = calendar_id AND user_id = auth.uid())
  );
CREATE POLICY "calendar_events_insert_own" ON public.calendar_events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.connected_calendars WHERE id = calendar_id AND user_id = auth.uid())
  );
CREATE POLICY "calendar_events_update_own" ON public.calendar_events
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.connected_calendars WHERE id = calendar_id AND user_id = auth.uid())
  );
CREATE POLICY "calendar_events_delete_own" ON public.calendar_events
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.connected_calendars WHERE id = calendar_id AND user_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX connected_calendars_user_id_idx ON public.connected_calendars(user_id);
CREATE INDEX connected_calendars_is_active_idx ON public.connected_calendars(is_active);
CREATE INDEX calendar_events_calendar_id_idx ON public.calendar_events(calendar_id);
CREATE INDEX calendar_events_start_time_idx ON public.calendar_events(start_time);
CREATE INDEX calendar_events_end_time_idx ON public.calendar_events(end_time);
CREATE INDEX calendar_events_is_birthday_idx ON public.calendar_events(is_birthday);
CREATE INDEX reminders_source_idx ON public.reminders(source);
CREATE INDEX reminders_source_event_id_idx ON public.reminders(source_event_id);

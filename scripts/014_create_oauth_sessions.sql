-- OAuth Sessions Table for Secure Token Storage
-- Temporarily stores OAuth tokens during the calendar connection flow
-- Tokens are stored server-side to avoid URL exposure

CREATE TABLE public.oauth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot TEXT NOT NULL CHECK (slot IN ('personal', 'work')),

  -- OAuth tokens (encrypted in transit via TLS, consider application-level encryption)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date BIGINT NOT NULL,
  google_account_id TEXT NOT NULL,
  google_account_email TEXT NOT NULL,

  -- Calendar list from Google (JSON array)
  calendars JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Session lifecycle
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),

  -- Ensure one active session per user per slot
  UNIQUE(user_id, slot)
);

-- Enable RLS
ALTER TABLE public.oauth_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access their own sessions
CREATE POLICY "oauth_sessions_select_own" ON public.oauth_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "oauth_sessions_insert_own" ON public.oauth_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "oauth_sessions_update_own" ON public.oauth_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "oauth_sessions_delete_own" ON public.oauth_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Index for quick lookups
CREATE INDEX oauth_sessions_user_id_idx ON public.oauth_sessions(user_id);
CREATE INDEX oauth_sessions_expires_at_idx ON public.oauth_sessions(expires_at);

-- Function to clean up expired sessions (can be called by cron)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.oauth_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

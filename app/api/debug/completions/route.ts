import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTodayLocal } from '@/lib/utils/date-utils';

/**
 * Debug endpoint to check reminder completions state
 * GET /api/debug/completions
 */
export async function GET() {
  const supabase = await createClient();
  const todayStr = getTodayLocal();

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({
      authenticated: false,
      error: authError?.message || 'No user',
      todayStr,
    });
  }

  // Get user's reminders
  const { data: reminders, error: remindersError } = await supabase
    .from('reminders')
    .select('id, title, user_id')
    .eq('user_id', user.id);

  // Get today's completions (RLS will filter)
  const { data: completions, error: completionsError } = await supabase
    .from('reminder_completions')
    .select('*')
    .eq('completion_date', todayStr);

  // Get ALL completions for user's reminders (to check if any exist)
  const reminderIds = reminders?.map(r => r.id) || [];
  const { data: allCompletions, error: allCompletionsError } = await supabase
    .from('reminder_completions')
    .select('*')
    .in('reminder_id', reminderIds.length > 0 ? reminderIds : ['no-reminders']);

  return NextResponse.json({
    authenticated: true,
    userId: user.id,
    todayStr,
    reminders: {
      count: reminders?.length || 0,
      data: reminders,
      error: remindersError?.message,
    },
    todayCompletions: {
      count: completions?.length || 0,
      data: completions,
      error: completionsError?.message,
    },
    allCompletions: {
      count: allCompletions?.length || 0,
      data: allCompletions,
      error: allCompletionsError?.message,
    },
  });
}

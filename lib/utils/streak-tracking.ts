import { createClient } from '@/lib/supabase/server';
import { Profile } from '@/lib/types';
import { getTodayLocal, addDaysToDateString, parseDateLocal } from '@/lib/utils/date-utils';

/**
 * Validates the user's streak on page load.
 * If last_completion_date is more than 1 day ago, resets streak to 0.
 * Returns the profile (updated if necessary) for immediate use.
 */
export async function validateStreak(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  
  // Get current profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) return null;

  // Use local timezone date strings for consistent comparison
  const todayStr = getTodayLocal();
  const yesterdayStr = addDaysToDateString(todayStr, -1);
  const lastCompletionStr = profile.last_completion_date;

  // If no last completion date, streak should already be 0
  if (!lastCompletionStr) {
    if (profile.current_streak !== 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ current_streak: 0 })
        .eq('id', userId);
      
      if (updateError) {
        console.error('[validateStreak] Failed to reset streak:', updateError);
        // Return original profile to reflect actual DB state
        return profile;
      }
      return { ...profile, current_streak: 0 };
    }
    return profile;
  }

  // Compare date strings directly (YYYY-MM-DD format is lexicographically sortable)
  const wasToday = lastCompletionStr === todayStr;
  const wasYesterday = lastCompletionStr === yesterdayStr;

  // If last completion was today or yesterday, streak is still valid
  if (wasToday || wasYesterday) {
    return profile;
  }

  // Last completion was more than 1 day ago - reset streak to 0
  if (profile.current_streak !== 0) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ current_streak: 0 })
      .eq('id', userId);
    
    if (updateError) {
      console.error('[validateStreak] Failed to reset streak:', updateError);
      // Return original profile to reflect actual DB state
      return profile;
    }
    return { ...profile, current_streak: 0 };
  }

  return profile;
}

export async function updateStreak(userId: string) {
  const supabase = await createClient();
  
  // Get current profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) return;

  // Use local timezone date strings for consistent comparison
  const todayStr = getTodayLocal();
  const yesterdayStr = addDaysToDateString(todayStr, -1);
  const lastCompletionStr = profile.last_completion_date;

  // If last completion was today, don't update (already counted)
  if (lastCompletionStr === todayStr) {
    return;
  }

  let newStreak = profile.current_streak;

  // If last completion was yesterday, increment streak
  if (lastCompletionStr === yesterdayStr) {
    newStreak += 1;
  } else {
    // Last completion was before yesterday or never - reset to 1
    newStreak = 1;
  }

  // Update longest streak if current exceeds it
  const newLongestStreak = Math.max(newStreak, profile.longest_streak);

  // Update profile
  await supabase
    .from('profiles')
    .update({
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_completion_date: todayStr,
    })
    .eq('id', userId);
}

/**
 * Helper function to check if user has completed anything on a given date
 * (either a task or a reminder with status='completed')
 */
async function hasCompletedAnythingOnDate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  dateStr: string
): Promise<boolean> {
  const nextDayStr = addDaysToDateString(dateStr, 1);
  
  // Check for completed tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('completed', true)
    .gte('completed_at', dateStr)
    .lt('completed_at', nextDayStr)
    .limit(1);

  if (tasks && tasks.length > 0) return true;

  // Check for completed reminders (not skipped)
  const { data: completions } = await supabase
    .from('reminder_completions')
    .select('id, reminders!inner(user_id)')
    .eq('reminders.user_id', userId)
    .eq('completion_date', dateStr)
    .eq('status', 'completed')
    .limit(1);

  return !!(completions && completions.length > 0);
}

export async function recalculateStreak(userId: string) {
  const supabase = await createClient();
  
  // Get current profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) return;

  const todayStr = getTodayLocal();
  const yesterdayStr = addDaysToDateString(todayStr, -1);

  // Check if there are any completed tasks today
  const { data: todayCompletedTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('completed', true)
    .gte('completed_at', todayStr)
    .lt('completed_at', addDaysToDateString(todayStr, 1))
    .limit(1);

  if (tasksError) {
    console.error('[v0] Error fetching today\'s completed tasks:', tasksError);
    return;
  }

  // Check if there are any completed reminders today (status='completed', not 'skipped')
  const { data: todayCompletedReminders } = await supabase
    .from('reminder_completions')
    .select('id, reminders!inner(user_id)')
    .eq('reminders.user_id', userId)
    .eq('completion_date', todayStr)
    .eq('status', 'completed')
    .limit(1);

  // If there are completed tasks or reminders today, keep the streak as is
  const hasCompletedToday = 
    (todayCompletedTasks && todayCompletedTasks.length > 0) ||
    (todayCompletedReminders && todayCompletedReminders.length > 0);

  if (hasCompletedToday) {
    return;
  }

  // No tasks or reminders completed today - need to check previous days
  let newStreak = profile.current_streak;
  let newLastCompletionDate = profile.last_completion_date;

  // Check if anything was completed yesterday
  const hasCompletedYesterday = await hasCompletedAnythingOnDate(supabase, userId, yesterdayStr);

  if (hasCompletedYesterday) {
    newLastCompletionDate = yesterdayStr;
    // Only decrement if the current last_completion_date was today
    // (meaning today's completion had incremented the streak)
    if (profile.last_completion_date === todayStr) {
      newStreak = Math.max(0, profile.current_streak - 1);
    }
  } else {
    // No completions yesterday either - need to find the last completion date
    // Check both tasks and reminders
    const { data: lastCompletedTask } = await supabase
      .from('tasks')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    const { data: lastCompletedReminder } = await supabase
      .from('reminder_completions')
      .select('completion_date, reminders!inner(user_id)')
      .eq('reminders.user_id', userId)
      .eq('status', 'completed')
      .order('completion_date', { ascending: false })
      .limit(1)
      .single();

    // Determine the most recent completion date
    let lastCompletionDateStr: string | null = null;

    if (lastCompletedTask?.completed_at) {
      lastCompletionDateStr = lastCompletedTask.completed_at.split('T')[0];
    }

    if (lastCompletedReminder?.completion_date) {
      if (!lastCompletionDateStr || lastCompletedReminder.completion_date > lastCompletionDateStr) {
        lastCompletionDateStr = lastCompletedReminder.completion_date;
      }
    }

    if (lastCompletionDateStr) {
      // Use parseDateLocal for timezone-aware date handling
      const today = parseDateLocal(todayStr);
      const lastDate = parseDateLocal(lastCompletionDateStr);
      const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));

      if (daysDiff > 1) {
        // Streak is broken - more than 1 day gap
        newStreak = 0;
      }
      
      newLastCompletionDate = lastCompletionDateStr;
    } else {
      // No completed tasks or reminders at all
      newStreak = 0;
      newLastCompletionDate = null;
    }
  }

  // Update profile with recalculated values
  await supabase
    .from('profiles')
    .update({
      current_streak: newStreak,
      last_completion_date: newLastCompletionDate,
    })
    .eq('id', userId);
}

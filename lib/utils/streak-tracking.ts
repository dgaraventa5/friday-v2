import { createClient } from '@/lib/supabase/server';

export async function updateStreak(userId: string) {
  const supabase = await createClient();
  
  // Get current profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const lastCompletionDate = profile.last_completion_date
    ? new Date(profile.last_completion_date)
    : null;

  if (lastCompletionDate) {
    lastCompletionDate.setHours(0, 0, 0, 0);
  }

  let newStreak = profile.current_streak;

  // If last completion was today, don't update
  if (lastCompletionDate && lastCompletionDate.getTime() === today.getTime()) {
    return;
  }

  // If last completion was yesterday, increment streak
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastCompletionDate && lastCompletionDate.getTime() === yesterday.getTime()) {
    newStreak += 1;
  } else if (!lastCompletionDate || lastCompletionDate.getTime() < yesterday.getTime()) {
    // If last completion was before yesterday or never, reset to 1
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

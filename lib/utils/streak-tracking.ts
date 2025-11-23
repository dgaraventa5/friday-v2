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

export async function recalculateStreak(userId: string) {
  const supabase = await createClient();
  
  // Get current profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Check if there are any completed tasks today
  const { data: todayCompletedTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, completed_at')
    .eq('user_id', userId)
    .eq('completed', true)
    .gte('completed_at', todayStr)
    .lt('completed_at', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  if (tasksError) {
    console.error('[v0] Error fetching today\'s completed tasks:', tasksError);
    return;
  }

  // If there are completed tasks today, keep the streak as is
  if (todayCompletedTasks && todayCompletedTasks.length > 0) {
    return;
  }

  // No tasks completed today - need to check previous days
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Check if there were any completed tasks yesterday
  const { data: yesterdayCompletedTasks } = await supabase
    .from('tasks')
    .select('id, completed_at')
    .eq('user_id', userId)
    .eq('completed', true)
    .gte('completed_at', yesterdayStr)
    .lt('completed_at', todayStr);

  let newStreak = profile.current_streak;
  let newLastCompletionDate = profile.last_completion_date;

  // If we had completed tasks yesterday, the streak needs to be decremented by 1
  // (since we're removing today's completion which had incremented it)
  if (yesterdayCompletedTasks && yesterdayCompletedTasks.length > 0) {
    newLastCompletionDate = yesterdayStr;
    // Only decrement if the current last_completion_date was today
    // (meaning today's task had incremented the streak)
    const currentLastDate = profile.last_completion_date 
      ? new Date(profile.last_completion_date)
      : null;
    if (currentLastDate) {
      currentLastDate.setHours(0, 0, 0, 0);
      if (currentLastDate.getTime() === today.getTime()) {
        // Today's completion had incremented the streak, so decrement it back
        newStreak = Math.max(0, profile.current_streak - 1);
      }
    }
  } else {
    // No tasks completed yesterday either - need to find the last completion date
    const { data: lastCompletedTask } = await supabase
      .from('tasks')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (lastCompletedTask && lastCompletedTask.completed_at) {
      const lastDate = new Date(lastCompletedTask.completed_at);
      lastDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));

      if (daysDiff > 1) {
        // Streak is broken - more than 1 day gap
        newStreak = 0;
      }
      
      newLastCompletionDate = lastCompletedTask.completed_at.split('T')[0];
    } else {
      // No completed tasks at all
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

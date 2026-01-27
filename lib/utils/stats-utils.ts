import { Task } from '@/lib/types';
import { getTodayLocal, parseDateLocal, formatDateLocal } from './date-utils';

/**
 * Calculate completions per day for the last 7 days using completed_at
 * Returns array of 7 numbers (oldest to newest, ending with today)
 */
export function getWeeklyCompletionTrend(tasks: Task[]): number[] {
  const today = getTodayLocal();
  const todayDate = parseDateLocal(today);

  // Initialize array for 7 days
  const completions: number[] = [0, 0, 0, 0, 0, 0, 0];

  // Filter to only completed tasks with completed_at
  const completedTasks = tasks.filter(t => t.completed && t.completed_at);

  for (const task of completedTasks) {
    if (!task.completed_at) continue;

    // Parse the completed_at timestamp and get just the date portion
    const completedDate = new Date(task.completed_at);
    const completedDateStr = formatDateLocal(completedDate);
    const completedDateLocal = parseDateLocal(completedDateStr);

    // Calculate days ago (0 = today, 1 = yesterday, etc.)
    const diffMs = todayDate.getTime() - completedDateLocal.getTime();
    const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Only count if within last 7 days (0-6 days ago)
    if (daysAgo >= 0 && daysAgo < 7) {
      // Convert to array index (6 = today, 0 = 6 days ago)
      const index = 6 - daysAgo;
      completions[index]++;
    }
  }

  return completions;
}

/**
 * Calculate total remaining minutes for incomplete tasks scheduled for today
 * Uses estimated_hours field
 */
export function calculateRemainingMinutes(tasks: Task[]): number {
  const today = getTodayLocal();

  // Filter to incomplete tasks scheduled for today
  const todayIncompleteTasks = tasks.filter(
    t => !t.completed && t.start_date === today
  );

  // Sum estimated hours and convert to minutes
  const totalHours = todayIncompleteTasks.reduce(
    (sum, task) => sum + (task.estimated_hours || 0),
    0
  );

  return Math.round(totalHours * 60);
}

/**
 * Get motivational text based on progress and streak
 */
export function getMotivationalText(
  completed: number,
  total: number,
  streak: number
): string {
  // All done state
  if (total > 0 && completed === total) {
    if (streak >= 7) {
      return "You're on fire!";
    }
    return "All done for today!";
  }

  // No tasks state
  if (total === 0) {
    return "Ready when you are";
  }

  // Calculate progress percentage
  const progress = completed / total;

  // Progress-based messages
  if (progress === 0) {
    if (streak >= 3) {
      return "Keep the streak alive!";
    }
    return "Let's get started!";
  }

  if (progress < 0.5) {
    return "Making progress!";
  }

  if (progress < 0.75) {
    return "Halfway there!";
  }

  if (progress < 1) {
    const remaining = total - completed;
    if (remaining === 1) {
      return "Just one more to go!";
    }
    return "Almost there!";
  }

  return "Keep it up!";
}

/**
 * Format remaining minutes as a human-readable string
 */
export function formatRemainingTime(minutes: number): string {
  if (minutes <= 0) {
    return "All clear!";
  }

  if (minutes < 60) {
    return `~${minutes}min left`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  if (remainingMins === 0) {
    return `~${hours}h left`;
  }

  if (hours === 1 && remainingMins <= 30) {
    return `~${minutes}min left`;
  }

  return `~${hours}h ${remainingMins}min left`;
}

/**
 * Get day initials for the last 7 days (oldest to newest, ending with today)
 * Returns array like ['T', 'F', 'S', 'S', 'M', 'T', 'W'] if today is Wednesday
 */
export function getWeekDayLabels(): string[] {
  const dayInitials = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();
  const todayDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    // Calculate the day of week for (today - i days)
    const dayOfWeek = (todayDayOfWeek - i + 7) % 7;
    labels.push(dayInitials[dayOfWeek]);
  }

  return labels;
}

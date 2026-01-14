import { Task } from '@/lib/types';
import { TaskPartition } from './types';

/**
 * Partition tasks into completed, recurring, pinned, and to-schedule groups.
 *
 * Groups:
 * - completed: Tasks that are done (kept as-is)
 * - recurring: Tasks that repeat (kept with deduplication)
 * - pinned: Tasks manually pulled to today (kept for today only)
 * - toSchedule: Tasks that need to be rescheduled
 *
 * @param tasks - All tasks to partition
 * @param todayStr - Today's date string (YYYY-MM-DD)
 * @returns TaskPartition with four groups
 */
export function partitionTasks(tasks: Task[], todayStr: string): TaskPartition {
  const completed: Task[] = [];
  const recurring: Task[] = [];
  const pinned: Task[] = [];
  const toSchedule: Task[] = [];

  for (const task of tasks) {
    if (task.completed) {
      // Completed tasks stay as-is
      completed.push(task);
    } else if (task.is_recurring) {
      // Recurring tasks have their own schedule
      recurring.push(task);
    } else if (task.pinned_date === todayStr) {
      // Tasks pinned to today are respected (but only for today)
      pinned.push(task);
    } else {
      // Non-recurring, non-pinned incomplete tasks need scheduling
      toSchedule.push(task);
    }
  }

  return {
    completed,
    recurring,
    pinned,
    toSchedule,
  };
}

/**
 * Deduplicate recurring tasks by start_date and recurring_series_id.
 *
 * When multiple instances of the same recurring series exist for the same date,
 * keeps the older instance (first created) and removes duplicates.
 *
 * This prevents the same recurring task from appearing multiple times on a day.
 *
 * @param recurringTasks - Raw recurring tasks (may have duplicates)
 * @returns Deduplicated tasks and list of duplicates found
 */
export function deduplicateRecurringTasks(recurringTasks: Task[]): {
  tasks: Task[];
  duplicatesFound: string[];
} {
  const recurringTasksMap = new Map<string, Task>();
  const duplicatesFound: string[] = [];

  for (const task of recurringTasks) {
    // Tasks without start_date or recurring_series_id can't be deduplicated
    if (!task.start_date || !task.recurring_series_id) {
      recurringTasksMap.set(task.id, task);
      continue;
    }

    // Create a unique key for this date + series combination
    const key = `${task.start_date}:${task.recurring_series_id}`;

    if (recurringTasksMap.has(key)) {
      // Duplicate found - keep the one with the earlier created_at (first instance)
      const existing = recurringTasksMap.get(key)!;
      const existingCreatedAt = new Date(existing.created_at).getTime();
      const currentCreatedAt = new Date(task.created_at).getTime();

      if (currentCreatedAt < existingCreatedAt) {
        // Current task is older, replace the existing one
        duplicatesFound.push(`${task.title} on ${task.start_date} (kept older instance)`);
        recurringTasksMap.set(key, task);
      } else {
        duplicatesFound.push(`${task.title} on ${task.start_date} (removed duplicate)`);
      }
    } else {
      recurringTasksMap.set(key, task);
    }
  }

  return {
    tasks: Array.from(recurringTasksMap.values()),
    duplicatesFound,
  };
}

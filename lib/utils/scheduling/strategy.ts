import { Task, TaskWithScore } from '@/lib/types';
import { SchedulingContext } from './context';
import { SchedulingOptions, ScheduleSlotResult } from './types';
import { addDaysToDateString, parseDateLocal } from '../date-utils';

/**
 * Schedule tasks using greedy algorithm (highest priority first).
 *
 * Algorithm:
 * 1. For each task (sorted by priority):
 *    a. Try to find a slot using findSlotForTask()
 *    b. If slot found, reserve capacity and add to scheduled list
 *    c. If no slot found, use handleUnscheduledTask() fallback
 * 2. Return all scheduled tasks with warnings
 *
 * Complexity: O(n × lookAhead) where n = number of tasks
 * This is a huge improvement over the original O(n² × lookAhead)
 *
 * @param tasks - Sorted tasks (highest priority first)
 * @param context - SchedulingContext for capacity tracking
 * @param options - Scheduling options (look-ahead, limits, etc.)
 * @returns Scheduled tasks and warnings
 */
export function scheduleTasksGreedy(
  tasks: TaskWithScore[],
  context: SchedulingContext,
  options: SchedulingOptions
): {
  scheduled: Task[];
  warnings: string[];
} {
  const scheduled: Task[] = [];
  const warnings: string[] = [];

  // Track original dates for reschedule detection
  const originalDates = new Map(tasks.map(t => [t.id, t.start_date]));

  for (const task of tasks) {
    // Try to find a slot for this task
    const slotResult = findSlotForTask(task, context, options);

    if (slotResult.date) {
      // Found a slot - schedule the task
      const scheduledTask = { ...task, start_date: slotResult.date };
      scheduled.push(scheduledTask);

      // Debug: Log scheduling decisions for today
      if (slotResult.date === options.todayStr || task.start_date === options.todayStr) {
        console.log(`[Scheduling] Task "${task.title}": ${task.start_date} → ${slotResult.date}`,
          `(today capacity: ${context.getTaskCount(options.todayStr)}/${context.getMaxTasksForDate(options.todayStr)})`);
      }

      context.reserveCapacity(slotResult.date, scheduledTask);

      // Add warning if provided
      if (slotResult.warning) {
        warnings.push(slotResult.warning);
      }
    } else {
      // No slot found - use fallback logic
      const fallbackResult = handleUnscheduledTask(task, context, options);

      if (fallbackResult.date) {
        const scheduledTask = { ...task, start_date: fallbackResult.date };
        scheduled.push(scheduledTask);
        context.reserveCapacity(fallbackResult.date, scheduledTask);
      } else {
        // Couldn't schedule at all - leave unscheduled
        scheduled.push(task);
      }

      // Add fallback warning
      if (fallbackResult.warning) {
        warnings.push(fallbackResult.warning);
      }
    }
  }

  return {
    scheduled,
    warnings,
  };
}

/**
 * Find a slot for a single task.
 *
 * Strategy:
 * 1. Calculate maxDayOffset (min of due_date distance or lookAheadDays)
 * 2. Try days from today → maxDayOffset
 * 3. If not scheduled and due_date exists, try days after due_date
 * 4. Return slot or null
 *
 * Complexity: O(lookAhead) with O(1) capacity checks
 *
 * @param task - Task to schedule
 * @param context - SchedulingContext for capacity checks
 * @param options - Scheduling options
 * @returns { date, warning } or { null, null }
 */
export function findSlotForTask(
  task: TaskWithScore,
  context: SchedulingContext,
  options: SchedulingOptions
): ScheduleSlotResult {
  const { todayStr, lookAheadDays } = options;

  // Calculate max days to look ahead (up to due_date or lookAheadDays)
  const maxDayOffset = task.due_date
    ? Math.min(
        calculateDaysUntil(todayStr, task.due_date) < 0
          ? lookAheadDays // Overdue - search full lookahead
          : Math.max(0, calculateDaysUntil(todayStr, task.due_date) + 1), // +1 to include due_date
        lookAheadDays
      )
    : lookAheadDays;

  // Try each day from today up to maxDayOffset
  for (let dayOffset = 0; dayOffset < maxDayOffset; dayOffset++) {
    const dateStr = addDaysToDateString(todayStr, dayOffset);
    const capacityCheck = context.canFitTask(dateStr, task);

    if (capacityCheck.canFit) {
      // Found a slot!
      return { date: dateStr, warning: null };
    }
  }

  // If we limited the search by due_date, try days after due_date up to lookAheadDays
  if (maxDayOffset < lookAheadDays) {
    for (let dayOffset = maxDayOffset; dayOffset < lookAheadDays; dayOffset++) {
      const dateStr = addDaysToDateString(todayStr, dayOffset);
      const capacityCheck = context.canFitTask(dateStr, task);

      if (capacityCheck.canFit) {
        // Found a slot after due date
        return {
          date: dateStr,
          warning: `Task "${task.title}" scheduled after due date on ${dateStr} to maintain daily limits.`,
        };
      }
    }
  }

  // No slot found
  return { date: null, warning: null };
}

/**
 * Handle tasks that couldn't be scheduled normally.
 *
 * Fallback logic:
 * - If has due_date: Try to schedule on due_date (may exceed limits)
 * - If due_date full: Find next available day after due_date
 * - If no capacity: Force to due_date with warning
 * - If no due_date: Return null with warning
 *
 * This ensures tasks with deadlines are never left unscheduled,
 * even if it means exceeding capacity limits.
 *
 * @param task - Unscheduled task
 * @param context - SchedulingContext
 * @param options - Scheduling options
 * @returns { date, warning }
 */
export function handleUnscheduledTask(
  task: TaskWithScore,
  context: SchedulingContext,
  options: SchedulingOptions
): ScheduleSlotResult {
  const { todayStr, lookAheadDays } = options;

  if (!task.due_date) {
    // No due_date and couldn't fit - leave unscheduled
    return {
      date: null,
      warning: `Task "${task.title}" could not be scheduled. Please adjust capacity limits or task duration.`,
    };
  }

  const dueDate = task.due_date;

  // Check if task is overdue first
  const dueDateMs = parseDateLocal(dueDate).getTime();
  const todayMs = parseDateLocal(todayStr).getTime();
  const isOverdue = dueDateMs < todayMs;

  // For overdue tasks, try to force schedule to today
  if (isOverdue) {
    const todayMaxTasks = context.getMaxTasksForDate(todayStr);
    const todayTaskCount = context.getTaskCount(todayStr);

    if (todayTaskCount < todayMaxTasks) {
      // Can fit on today without exceeding task limit (may exceed hours)
      return {
        date: todayStr,
        warning: `Task "${task.title}" is overdue and scheduled for today, but may exceed capacity limits.`,
      };
    } else {
      // Today is full - force schedule anyway since it's overdue
      return {
        date: todayStr,
        warning: `Task "${task.title}" is overdue and scheduled for today, but exceeds ${todayMaxTasks}-task daily limit.`,
      };
    }
  }

  // For non-overdue tasks, try due_date first if it has space for tasks (may exceed hours)
  // But only if the due date is within the lookahead window
  const dueDateOffset = calculateDaysUntil(todayStr, dueDate);

  if (dueDateOffset < lookAheadDays) {
    const maxTasks = context.getMaxTasksForDate(dueDate);
    const currentTaskCount = context.getTaskCount(dueDate);

    if (currentTaskCount < maxTasks) {
      return {
        date: dueDate,
        warning: `Task "${task.title}" scheduled on due date (${dueDate}) but may exceed capacity limits.`,
      };
    }
  }

  // Due date is full or outside lookahead - find next available day after due date

  for (let dayOffset = dueDateOffset + 1; dayOffset < lookAheadDays; dayOffset++) {
    const dateStr = addDaysToDateString(todayStr, dayOffset);
    const dateMaxTasks = context.getMaxTasksForDate(dateStr);
    const dateTaskCount = context.getTaskCount(dateStr);

    if (dateTaskCount < dateMaxTasks) {
      // Found a slot after due date (respects task limit but may exceed hours)
      return {
        date: dateStr,
        warning: `Task "${task.title}" scheduled on ${dateStr} (due date ${dueDate} was full).`,
      };
    }
  }

  // Couldn't find any slot anywhere and task is not overdue - leave unscheduled
  return {
    date: null,
    warning: `Task "${task.title}" due on ${dueDate} could not be scheduled. Please adjust capacity limits or reschedule some tasks.`,
  };
}

/**
 * Helper: Calculate days between two date strings.
 *
 * @param fromDateStr - Start date (YYYY-MM-DD)
 * @param toDateStr - End date (YYYY-MM-DD)
 * @returns Number of days (can be negative if toDateStr is before fromDateStr)
 */
function calculateDaysUntil(fromDateStr: string, toDateStr: string): number {
  const from = parseDateLocal(fromDateStr);
  const to = parseDateLocal(toDateStr);
  const diffMs = to.getTime() - from.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

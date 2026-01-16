import { Task, RecalibrationTask, RecalibrationLocalStorage, DatePreset } from '@/lib/types';
import { getTodayLocal, addDaysToDateString, parseDateLocal } from './date-utils';

/**
 * Calculate days overdue (positive = overdue, negative = due in future, 0 = today)
 */
function calculateDaysOverdue(dueDate: string, today: string): number {
  const due = parseDateLocal(dueDate);
  const todayDate = parseDateLocal(today);
  const diffMs = todayDate.getTime() - due.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Maximum days overdue to include in recalibration (older tasks are excluded)
const MAX_OVERDUE_DAYS = 30;

/**
 * Filter and categorize tasks that need recalibration attention
 */
export function getTasksForRecalibration(
  tasks: Task[],
  includeTomorrow: boolean = true
): { overdue: RecalibrationTask[]; dueToday: RecalibrationTask[]; dueTomorrow: RecalibrationTask[] } {
  const today = getTodayLocal();
  const tomorrow = addDaysToDateString(today, 1);

  // Only include tasks that have both due_date and start_date (consistent with Schedule view)
  // Tasks without start_date are orphaned/never scheduled and shouldn't appear
  const incompleteTasks = tasks.filter(t => !t.completed && t.due_date && t.start_date);

  const overdue: RecalibrationTask[] = [];
  const dueToday: RecalibrationTask[] = [];
  const dueTomorrow: RecalibrationTask[] = [];

  for (const task of incompleteTasks) {
    const dueDate = task.due_date!;
    const daysOverdue = calculateDaysOverdue(dueDate, today);

    const recalTask: RecalibrationTask = {
      ...task,
      daysOverdue,
      originalDueDate: dueDate,
      pendingChanges: null,
    };

    if (dueDate < today) {
      // Only include overdue tasks within the cutoff (30 days)
      if (daysOverdue <= MAX_OVERDUE_DAYS) {
        overdue.push(recalTask);
      }
    } else if (dueDate === today) {
      dueToday.push(recalTask);
    } else if (dueDate === tomorrow && includeTomorrow) {
      dueTomorrow.push(recalTask);
    }
  }

  // Sort overdue by most overdue first
  overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);

  return { overdue, dueToday, dueTomorrow };
}

/**
 * Parse trigger hour from database time string (e.g., "17:00:00" -> 17)
 */
export function parseTriggerHour(timeString: string): number {
  const parts = timeString.split(':');
  return parseInt(parts[0], 10) || 17; // Default to 5 PM
}

/**
 * Check if recalibration modal should be shown
 * @param tasks - User's tasks to check
 * @param triggerHour - Hour of day to trigger (default 17 = 5 PM)
 * @param lastDismissedDate - Date from profile (cross-device), "YYYY-MM-DD" format or null
 * @param snoozedUntil - Snooze timestamp from localStorage (device-specific), ISO format or null
 * @param isEnabled - Whether recalibration feature is enabled
 */
export function shouldShowRecalibration(
  tasks: Task[],
  triggerHour: number = 17,
  lastDismissedDate: string | null,
  snoozedUntil: string | null,
  isEnabled: boolean = true
): boolean {
  // Check if feature is enabled
  if (!isEnabled) {
    return false;
  }

  const today = getTodayLocal();
  const now = new Date();
  const currentHour = now.getHours();

  // Check time threshold
  if (currentHour < triggerHour) {
    return false;
  }

  // Check if dismissed today (from profile - cross-device)
  if (lastDismissedDate === today) {
    return false;
  }

  // Check if snoozed (from localStorage - device-specific)
  if (snoozedUntil) {
    const snoozeEnd = new Date(snoozedUntil);
    if (now < snoozeEnd) {
      return false;
    }
  }

  // Check if any tasks need attention (overdue or due today)
  const { overdue, dueToday } = getTasksForRecalibration(tasks, false);
  return overdue.length > 0 || dueToday.length > 0;
}

/**
 * Calculate new due date from preset
 */
export function calculatePresetDate(preset: DatePreset): string {
  const today = getTodayLocal();

  switch (preset) {
    case 'tomorrow':
      return addDaysToDateString(today, 1);
    case 'plus2':
      return addDaysToDateString(today, 2);
    case 'plus7':
      return addDaysToDateString(today, 7);
    default:
      return today;
  }
}

/**
 * Get human-readable relative date string for display
 */
export function getRelativeDateString(dueDate: string): string {
  const today = getTodayLocal();
  const daysOverdue = calculateDaysOverdue(dueDate, today);

  if (daysOverdue === 0) {
    return 'Today';
  } else if (daysOverdue === 1) {
    return '1 day ago';
  } else if (daysOverdue > 1) {
    return `${daysOverdue} days ago`;
  } else if (daysOverdue === -1) {
    return 'Tomorrow';
  } else {
    return `In ${Math.abs(daysOverdue)} days`;
  }
}

/**
 * Get snooze end time (1 hour from now)
 */
export function getSnoozeEndTime(): string {
  const snoozeEnd = new Date();
  snoozeEnd.setHours(snoozeEnd.getHours() + 1);
  return snoozeEnd.toISOString();
}

/**
 * Get quadrant label for display
 */
export function getQuadrantLabel(importance: string, urgency: string): { label: string; sublabel: string } {
  const isImportant = importance === 'important';
  const isUrgent = urgency === 'urgent';

  if (isUrgent && isImportant) {
    return { label: 'Critical', sublabel: 'Do First' };
  } else if (!isUrgent && isImportant) {
    return { label: 'Plan', sublabel: 'Schedule' };
  } else if (isUrgent && !isImportant) {
    return { label: 'Delegate', sublabel: 'Quick Wins' };
  } else {
    return { label: 'Backlog', sublabel: 'Consider' };
  }
}

/**
 * Format date for display in task card (e.g., "Jan 12")
 */
export function formatDueDateForDisplay(dateStr: string): string {
  const date = parseDateLocal(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

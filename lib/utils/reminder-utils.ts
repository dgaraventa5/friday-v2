import { Reminder, ReminderCompletion, ReminderWithStatus } from '@/lib/types';
import { getTodayLocal, parseDateLocal, getDayOfWeek } from './date-utils';

/**
 * Check if a reminder is scheduled for a given date
 */
export function isReminderScheduledForDate(
  reminder: Reminder,
  dateStr: string
): boolean {
  if (!reminder.is_active) return false;
  
  const date = parseDateLocal(dateStr);
  // Parse the full timestamp, then normalize to local midnight
  const createdTimestamp = new Date(reminder.created_at);
  const createdDate = new Date(
    createdTimestamp.getFullYear(),
    createdTimestamp.getMonth(),
    createdTimestamp.getDate(),
    0, 0, 0, 0
  );
  
  // Don't show reminders for dates before they were created
  if (date < createdDate) return false;
  
  // Check if reminder has ended (for 'after' end type)
  if (reminder.end_type === 'after' && reminder.end_count) {
    if (reminder.current_count >= reminder.end_count) {
      return false;
    }
  }
  
  switch (reminder.recurrence_type) {
    case 'daily':
      return isDailyMatch(reminder, createdDate, date);
    case 'weekly':
      return isWeeklyMatch(reminder, createdDate, date);
    case 'monthly':
      return isMonthlyMatch(reminder, createdDate, date);
    default:
      return false;
  }
}

/**
 * Check if date matches daily recurrence pattern
 */
function isDailyMatch(reminder: Reminder, startDate: Date, targetDate: Date): boolean {
  const daysDiff = Math.floor(
    (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysDiff >= 0 && daysDiff % reminder.recurrence_interval === 0;
}

/**
 * Check if date matches weekly recurrence pattern
 */
function isWeeklyMatch(reminder: Reminder, startDate: Date, targetDate: Date): boolean {
  if (!reminder.recurrence_days || reminder.recurrence_days.length === 0) {
    return false;
  }
  
  const dayOfWeek = targetDate.getDay();
  if (!reminder.recurrence_days.includes(dayOfWeek)) {
    return false;
  }
  
  // Check week interval - calculate weeks since start
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysDiff = Math.floor((targetDate.getTime() - startDate.getTime()) / msPerDay);
  
  // Get the start of week for both dates (Sunday = 0)
  const startDayOfWeek = startDate.getDay();
  const adjustedDays = daysDiff + startDayOfWeek;
  const weeksDiff = Math.floor(adjustedDays / 7);
  
  return weeksDiff >= 0 && weeksDiff % reminder.recurrence_interval === 0;
}

/**
 * Check if date matches monthly recurrence pattern
 */
function isMonthlyMatch(reminder: Reminder, startDate: Date, targetDate: Date): boolean {
  // First check if this is the correct month based on interval
  const monthsDiff = 
    (targetDate.getFullYear() - startDate.getFullYear()) * 12 +
    (targetDate.getMonth() - startDate.getMonth());
  
  if (monthsDiff < 0 || monthsDiff % reminder.recurrence_interval !== 0) {
    return false;
  }
  
  if (reminder.monthly_type === 'day_of_month') {
    // Check if recurrence_days contains the day of month
    const dayOfMonth = targetDate.getDate();
    return reminder.recurrence_days?.includes(dayOfMonth) ?? false;
  }
  
  if (reminder.monthly_type === 'nth_weekday') {
    const dayOfWeek = targetDate.getDay();
    const dayOfMonth = targetDate.getDate();
    
    // Check if correct day of week
    if (!reminder.recurrence_days?.includes(dayOfWeek)) {
      return false;
    }
    
    // Calculate which week position this is (1st, 2nd, 3rd, 4th)
    const weekPosition = Math.ceil(dayOfMonth / 7);
    
    // Handle "last" weekday (-1)
    if (reminder.monthly_week_position === -1) {
      const lastDayOfMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0
      ).getDate();
      const daysRemaining = lastDayOfMonth - dayOfMonth;
      return daysRemaining < 7; // Is this the last occurrence of this weekday?
    }
    
    return weekPosition === reminder.monthly_week_position;
  }
  
  return false;
}

/**
 * Get all reminders scheduled for today with their completion status
 */
export function getTodaysReminders(
  reminders: Reminder[],
  completions: ReminderCompletion[]
): ReminderWithStatus[] {
  const today = getTodayLocal();
  const todayCompletions = completions.filter(c => c.completion_date === today);
  
  return reminders
    .filter(r => isReminderScheduledForDate(r, today))
    .map(reminder => {
      const completion = todayCompletions.find(c => c.reminder_id === reminder.id);
      const status: 'incomplete' | 'completed' | 'skipped' = completion?.status ?? 'incomplete';
      return {
        ...reminder,
        todayStatus: status,
      };
    })
    .sort((a, b) => {
      // Sort by time_label if available, then by title
      if (a.time_label && b.time_label) {
        return a.time_label.localeCompare(b.time_label);
      }
      if (a.time_label) return -1;
      if (b.time_label) return 1;
      return a.title.localeCompare(b.title);
    });
}

/**
 * Get human-readable recurrence label
 */
export function getRecurrenceLabel(reminder: Reminder): string {
  const interval = reminder.recurrence_interval;
  
  switch (reminder.recurrence_type) {
    case 'daily':
      return interval === 1 ? 'Daily' : `Every ${interval} days`;
      
    case 'weekly': {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days = reminder.recurrence_days
        ?.sort((a, b) => a - b)
        .map(d => dayNames[d])
        .join(', ');
      const weekPrefix = interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      return days ? `${weekPrefix} on ${days}` : weekPrefix;
    }
      
    case 'monthly': {
      const monthPrefix = interval === 1 ? 'Monthly' : `Every ${interval} months`;
      if (reminder.monthly_type === 'day_of_month') {
        const day = reminder.recurrence_days?.[0];
        if (day) {
          const suffix = getOrdinalSuffix(day);
          return `${monthPrefix} on the ${day}${suffix}`;
        }
        return monthPrefix;
      }
      if (reminder.monthly_type === 'nth_weekday') {
        const positions = ['first', 'second', 'third', 'fourth'];
        const position = reminder.monthly_week_position === -1 
          ? 'last' 
          : positions[(reminder.monthly_week_position ?? 1) - 1];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[reminder.recurrence_days?.[0] ?? 0];
        return `${monthPrefix} on the ${position} ${dayName}`;
      }
      return monthPrefix;
    }
      
    default:
      return 'Unknown';
  }
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Format time label for display
 */
export function formatTimeLabel(timeLabel: string | null): string | null {
  if (!timeLabel) return null;
  
  // Parse "HH:MM:SS" or "HH:MM" format
  const parts = timeLabel.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) return null;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get the day of week name
 */
export function getDayOfWeekName(dayIndex: number, short: boolean = false): string {
  const fullNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return short ? shortNames[dayIndex] : fullNames[dayIndex];
}

/**
 * Get the nth weekday position label
 */
export function getNthWeekdayLabel(position: number): string {
  if (position === -1) return 'last';
  const positions = ['first', 'second', 'third', 'fourth'];
  return positions[position - 1] || 'first';
}

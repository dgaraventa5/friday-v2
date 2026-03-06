import { Task } from '@/lib/types';
import { formatDateLocal, parseDateLocal, addDaysToDateString, getDayOfWeek } from './date-utils';

// Generate the next instance of a recurring task
export function generateNextRecurringInstance(completedTask: Task): Task | null {
  if (!completedTask.is_recurring) return null;
  
  // Check if we've reached the end count
  if (
    completedTask.recurring_end_type === 'after' &&
    completedTask.recurring_end_count &&
    completedTask.recurring_current_count >= completedTask.recurring_end_count
  ) {
    return null;
  }
  
  const currentDueDateStr = completedTask.due_date || formatDateLocal(new Date(completedTask.created_at));
  let nextDueDateStr = currentDueDateStr;
  
  switch (completedTask.recurring_interval) {
    case 'daily':
      nextDueDateStr = addDaysToDateString(currentDueDateStr, 1);
      break;
      
    case 'weekly':
      if (completedTask.recurring_days && completedTask.recurring_days.length > 0) {
        const currentDay = getDayOfWeek(currentDueDateStr);
        const sortedDays = [...completedTask.recurring_days].sort((a, b) => a - b);
        
        // Find next day in the cycle
        let nextDay = sortedDays.find(day => day > currentDay);
        
        if (nextDay !== undefined) {
          // Next occurrence is later this week
          const daysToAdd = nextDay - currentDay;
          nextDueDateStr = addDaysToDateString(currentDueDateStr, daysToAdd);
        } else {
          // Next occurrence is first day of next week
          const firstDay = sortedDays[0];
          const daysToAdd = 7 - currentDay + firstDay;
          nextDueDateStr = addDaysToDateString(currentDueDateStr, daysToAdd);
        }
      } else {
        // Fallback: add 7 days
        nextDueDateStr = addDaysToDateString(currentDueDateStr, 7);
      }
      break;
      
    case 'monthly':
      // Add 1 month, keeping the same day of month
      const currentDate = parseDateLocal(currentDueDateStr);
      currentDate.setMonth(currentDate.getMonth() + 1);
      nextDueDateStr = formatDateLocal(currentDate);
      break;
  }
  
  // Create new task instance
  const nextInstance: Partial<Task> = {
    title: completedTask.title,
    description: completedTask.description,
    importance: completedTask.importance,
    urgency: completedTask.urgency,
    estimated_hours: completedTask.estimated_hours,
    category: completedTask.category,
    due_date: nextDueDateStr,
    start_date: nextDueDateStr, // Recurring tasks have start_date = due_date
    recurring_series_id: completedTask.recurring_series_id,
    is_recurring: true,
    recurring_interval: completedTask.recurring_interval,
    recurring_days: completedTask.recurring_days,
    recurring_end_type: completedTask.recurring_end_type,
    recurring_end_count: completedTask.recurring_end_count,
    recurring_current_count: completedTask.recurring_current_count + 1,
    completed: false,
  };
  
  return nextInstance as Task;
}

export function generateInitialRecurringInstances(
  baseTask: Partial<Task>,
  weeksAhead: number = 4
): Partial<Task>[] {
  // If not a recurring task, just return as-is (non-recurring tasks are scheduled by assignStartDates)
  if (!baseTask.is_recurring) {
    return [baseTask];
  }

  const instances: Partial<Task>[] = [];
  const startDateStr = baseTask.due_date || formatDateLocal(new Date());
  let instanceCount = 1;

  // Helper to check if we've reached the end count
  const hasReachedEndCount = () => {
    return (
      baseTask.recurring_end_type === 'after' &&
      baseTask.recurring_end_count &&
      instanceCount > baseTask.recurring_end_count
    );
  };

  // Helper to create an instance
  const createInstance = (dateStr: string) => {
    return {
      ...baseTask,
      due_date: dateStr,
      start_date: dateStr, // Recurring tasks have start_date = due_date
      recurring_current_count: instanceCount,
    };
  };

  switch (baseTask.recurring_interval) {
    case 'daily': {
      // Generate daily instances for the look-ahead period
      const endDateStr = addDaysToDateString(startDateStr, weeksAhead * 7);
      let currentDateStr = startDateStr;

      while (currentDateStr <= endDateStr) {
        if (hasReachedEndCount()) break;

        instances.push(createInstance(currentDateStr));
        instanceCount++;
        currentDateStr = addDaysToDateString(currentDateStr, 1);
      }
      break;
    }

    case 'weekly': {
      // Weekly tasks require recurring_days to be set
      if (!baseTask.recurring_days || baseTask.recurring_days.length === 0) {
        // Fallback: just create single instance with start_date set
        instances.push(createInstance(startDateStr));
        break;
      }

      const endDateStr = addDaysToDateString(startDateStr, weeksAhead * 7);
      let currentDateStr = startDateStr;

      // Generate instances for each occurrence day within the time window
      while (currentDateStr <= endDateStr) {
        if (hasReachedEndCount()) break;

        const dayOfWeek = getDayOfWeek(currentDateStr);
        
        if (baseTask.recurring_days.includes(dayOfWeek)) {
          instances.push(createInstance(currentDateStr));
          instanceCount++;
        }

        currentDateStr = addDaysToDateString(currentDateStr, 1);
      }
      break;
    }

    case 'monthly': {
      // Generate monthly instances for the look-ahead period
      // For monthly, we generate instances for several months ahead
      const monthsAhead = Math.max(weeksAhead, 4); // At least 4 months for monthly tasks
      let currentDate = parseDateLocal(startDateStr);
      const originalDayOfMonth = currentDate.getDate();

      for (let i = 0; i < monthsAhead; i++) {
        if (hasReachedEndCount()) break;

        // Handle months with fewer days (e.g., Jan 31 -> Feb 28)
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
        const lastDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
        const dayToUse = Math.min(originalDayOfMonth, lastDayOfMonth);
        targetDate.setDate(dayToUse);

        const dateStr = formatDateLocal(targetDate);
        instances.push(createInstance(dateStr));
        instanceCount++;
      }
      break;
    }

    default:
      // Unknown interval - just return the base task with start_date set
      instances.push(createInstance(startDateStr));
  }

  return instances;
}

// Check if there's already an instance of this recurring series on a given date
export function hasRecurringInstanceOnDate(
  tasks: Task[],
  seriesId: string,
  date: string
): boolean {
  return tasks.some(
    t => t.recurring_series_id === seriesId && 
    t.start_date === date &&
    !t.completed
  );
}

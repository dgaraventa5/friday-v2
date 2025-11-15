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
        
        console.log('[v0] Next instance: current day (local):', currentDay, 'recurring_days:', sortedDays);
        
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
  
  console.log('[v0] Generated next instance due date:', nextDueDateStr);
  
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
  if (!baseTask.is_recurring || baseTask.recurring_interval !== 'weekly' || !baseTask.recurring_days || baseTask.recurring_days.length === 0) {
    return [baseTask];
  }

  const instances: Partial<Task>[] = [];
  
  const startDateStr = baseTask.due_date || formatDateLocal(new Date());
  const endDateStr = addDaysToDateString(startDateStr, weeksAhead * 7);
  
  let currentDateStr = startDateStr;
  let instanceCount = 1;

  console.log('[v0] Generating recurring instances from', startDateStr, 'to', endDateStr);
  console.log('[v0] Recurring days:', baseTask.recurring_days);

  // Generate instances for each occurrence day within the time window
  while (currentDateStr <= endDateStr) {
    const dayOfWeek = getDayOfWeek(currentDateStr);
    
    if (baseTask.recurring_days.includes(dayOfWeek)) {
      // Check if we've reached the end count
      if (
        baseTask.recurring_end_type === 'after' &&
        baseTask.recurring_end_count &&
        instanceCount > baseTask.recurring_end_count
      ) {
        break;
      }

      console.log('[v0] Creating instance for day', dayOfWeek, 'on date', currentDateStr);

      instances.push({
        ...baseTask,
        due_date: currentDateStr,
        start_date: currentDateStr, // Set start_date = due_date for recurring tasks
        recurring_current_count: instanceCount,
      });

      instanceCount++;
    }

    currentDateStr = addDaysToDateString(currentDateStr, 1);
  }

  console.log('[v0] Generated', instances.length, 'recurring instances');

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

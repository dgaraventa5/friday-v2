import { Task } from '@/lib/types';

// Utility to normalize date to UTC at noon to prevent timezone shifts
function normalizeToUTC(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0));
}

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
  
  const currentDueDate = normalizeToUTC(new Date(completedTask.due_date || completedTask.created_at));
  let nextDueDate = new Date(currentDueDate);
  
  switch (completedTask.recurring_interval) {
    case 'daily':
      nextDueDate.setUTCDate(nextDueDate.getUTCDate() + 1);
      break;
    case 'weekly':
      if (completedTask.recurring_days && completedTask.recurring_days.length > 0) {
        const currentDay = currentDueDate.getUTCDay();
        const sortedDays = [...completedTask.recurring_days].sort((a, b) => a - b);
        
        console.log('[v0] Next instance: current day (UTC):', currentDay, 'recurring_days:', sortedDays);
        
        // Find next day in the cycle
        let nextDay = sortedDays.find(day => day > currentDay);
        
        if (nextDay !== undefined) {
          // Next occurrence is later this week
          const daysToAdd = nextDay - currentDay;
          nextDueDate.setUTCDate(nextDueDate.getUTCDate() + daysToAdd);
        } else {
          // Next occurrence is first day of next week
          const firstDay = sortedDays[0];
          const daysToAdd = 7 - currentDay + firstDay;
          nextDueDate.setUTCDate(nextDueDate.getUTCDate() + daysToAdd);
        }
      } else {
        // Fallback: add 7 days
        nextDueDate.setUTCDate(nextDueDate.getUTCDate() + 7);
      }
      break;
    case 'monthly':
      nextDueDate.setUTCMonth(nextDueDate.getUTCMonth() + 1);
      break;
  }
  
  const dueDateStr = nextDueDate.toISOString().split('T')[0];
  
  // Create new task instance
  const nextInstance: Partial<Task> = {
    title: completedTask.title,
    description: completedTask.description,
    importance: completedTask.importance,
    urgency: completedTask.urgency,
    estimated_hours: completedTask.estimated_hours,
    category: completedTask.category,
    due_date: dueDateStr,
    start_date: dueDateStr, // Recurring tasks have start_date = due_date
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
  const startDate = normalizeToUTC(new Date(baseTask.due_date || new Date()));
  
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + (weeksAhead * 7));

  let currentDate = new Date(startDate);
  let instanceCount = 1;

  console.log('[v0] Generating recurring instances from', startDate.toISOString(), 'to', endDate.toISOString());
  console.log('[v0] Recurring days:', baseTask.recurring_days);

  // Generate instances for each occurrence day within the time window
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getUTCDay();
    
    if (baseTask.recurring_days.includes(dayOfWeek)) {
      // Check if we've reached the end count
      if (
        baseTask.recurring_end_type === 'after' &&
        baseTask.recurring_end_count &&
        instanceCount > baseTask.recurring_end_count
      ) {
        break;
      }

      const dateStr = currentDate.toISOString().split('T')[0];
      console.log('[v0] Creating instance for day', dayOfWeek, 'on date', dateStr);

      instances.push({
        ...baseTask,
        due_date: dateStr,
        start_date: dateStr, // Set start_date = due_date for recurring tasks
        recurring_current_count: instanceCount,
      });

      instanceCount++;
    }

    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
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

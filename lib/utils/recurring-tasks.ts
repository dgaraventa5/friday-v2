import { Task } from '@/lib/types';

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
  
  // Calculate next due date based on interval
  const currentDueDate = new Date(completedTask.due_date || completedTask.created_at);
  let nextDueDate = new Date(currentDueDate);
  
  switch (completedTask.recurring_interval) {
    case 'daily':
      nextDueDate.setDate(nextDueDate.getDate() + 1);
      break;
    case 'weekly':
      if (completedTask.recurring_days && completedTask.recurring_days.length > 0) {
        const currentDay = currentDueDate.getDay();
        const sortedDays = [...completedTask.recurring_days].sort((a, b) => a - b);
        
        // Find next day in the cycle
        let nextDay = sortedDays.find(day => day > currentDay);
        
        if (nextDay !== undefined) {
          // Next occurrence is later this week
          const daysToAdd = nextDay - currentDay;
          nextDueDate.setDate(nextDueDate.getDate() + daysToAdd);
        } else {
          // Next occurrence is first day of next week
          const firstDay = sortedDays[0];
          const daysToAdd = 7 - currentDay + firstDay;
          nextDueDate.setDate(nextDueDate.getDate() + daysToAdd);
        }
      } else {
        // Fallback: add 7 days
        nextDueDate.setDate(nextDueDate.getDate() + 7);
      }
      break;
    case 'monthly':
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
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
    due_date: nextDueDate.toISOString().split('T')[0],
    recurring_series_id: completedTask.recurring_series_id,
    is_recurring: true,
    recurring_interval: completedTask.recurring_interval,
    recurring_days: completedTask.recurring_days,
    recurring_end_type: completedTask.recurring_end_type,
    recurring_end_count: completedTask.recurring_end_count,
    recurring_current_count: completedTask.recurring_current_count + 1,
    completed: false,
    start_date: null, // Will be assigned by scheduling algorithm
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
  const startDate = new Date(baseTask.due_date || new Date());
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (weeksAhead * 7));

  let currentDate = new Date(startDate);
  let instanceCount = 1;

  // Generate instances for each occurrence day within the time window
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    if (baseTask.recurring_days.includes(dayOfWeek)) {
      // Check if we've reached the end count
      if (
        baseTask.recurring_end_type === 'after' &&
        baseTask.recurring_end_count &&
        instanceCount > baseTask.recurring_end_count
      ) {
        break;
      }

      instances.push({
        ...baseTask,
        due_date: currentDate.toISOString().split('T')[0],
        recurring_current_count: instanceCount,
      });

      instanceCount++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
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

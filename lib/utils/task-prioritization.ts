import { Task, TaskWithScore, EisenhowerQuadrant, CategoryLimits, DailyMaxHours } from '@/lib/types';
import { getTodayLocal, formatDateLocal, parseDateLocal, compareDateStrings, addDaysToDateString, getDayOfWeek } from './date-utils';

// Eisenhower Matrix base scores
const QUADRANT_SCORES = {
  'urgent-important': 100,
  'not-urgent-important': 80,
  'urgent-not-important': 60,
  'not-urgent-not-important': 40,
} as const;

// Calculate Eisenhower quadrant for a task
export function getEisenhowerQuadrant(task: Task): EisenhowerQuadrant {
  const isUrgent = task.urgency === 'urgent';
  const isImportant = task.importance === 'important';

  if (isUrgent && isImportant) return 'urgent-important';
  if (!isUrgent && isImportant) return 'not-urgent-important';
  if (isUrgent && !isImportant) return 'urgent-not-important';
  return 'not-urgent-not-important';
}

// Calculate priority score for a task
export function calculatePriorityScore(task: Task): number {
  const quadrant = getEisenhowerQuadrant(task);
  let score = QUADRANT_SCORES[quadrant];

  // Add overdue bonus (+10 per day)
  if (task.due_date && !task.completed) {
    const todayStr = getTodayLocal();
    const comparison = compareDateStrings(todayStr, task.due_date);
    
    if (comparison > 0) {
      // Task is overdue
      const today = parseDateLocal(todayStr);
      const dueDate = parseDateLocal(task.due_date);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      score += daysOverdue * 10;
    }
  }

  // Add due today bonus (+40)
  if (task.due_date && !task.completed) {
    const todayStr = getTodayLocal();
    if (task.due_date === todayStr) {
      score += 40;
    }
  }

  // Add due soon bonus (+20 within 1 day, +10 within 3 days)
  if (task.due_date && !task.completed) {
    const todayStr = getTodayLocal();
    const today = parseDateLocal(todayStr);
    const dueDate = parseDateLocal(task.due_date);
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue === 1) {
      score += 20;
    } else if (daysUntilDue > 1 && daysUntilDue <= 3) {
      score += 10;
    }
  }

  // Add age bonus (+2 per day since creation, max +20)
  const todayStr = getTodayLocal();
  const today = parseDateLocal(todayStr);
  const createdDate = new Date(task.created_at);
  createdDate.setHours(0, 0, 0, 0);
  
  const daysOld = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const ageBonus = Math.min(daysOld * 2, 20);
  score += ageBonus;

  return score;
}

// Add score to tasks
export function addPriorityScores(tasks: Task[]): TaskWithScore[] {
  return tasks.map(task => ({
    ...task,
    priorityScore: calculatePriorityScore(task),
    quadrant: getEisenhowerQuadrant(task),
  }));
}

// Check if a date is a weekend
function isWeekend(dateStr: string): boolean {
  const day = getDayOfWeek(dateStr);
  return day === 0 || day === 6; // Sunday or Saturday
}

// Calculate hours used on a specific date for a category
function getHoursUsedForCategory(
  dateStr: string,
  category: string,
  scheduledTasks: Task[]
): number {
  return scheduledTasks
    .filter(t => t.start_date === dateStr && t.category === category)
    .reduce((sum, t) => sum + t.estimated_hours, 0);
}

// Calculate total hours used on a specific date
function getTotalHoursUsed(dateStr: string, scheduledTasks: Task[]): number {
  return scheduledTasks
    .filter(t => t.start_date === dateStr)
    .reduce((sum, t) => sum + t.estimated_hours, 0);
}

// Check if recurring task should be scheduled on this date
function shouldScheduleRecurringTask(task: Task, dateStr: string): boolean {
  if (!task.is_recurring) return true;
  
  const dayOfWeek = getDayOfWeek(dateStr);
  
  if (task.recurring_interval === 'daily') {
    return true;
  }
  
  if (task.recurring_interval === 'weekly' && task.recurring_days) {
    return task.recurring_days.includes(dayOfWeek);
  }
  
  if (task.recurring_interval === 'monthly') {
    const dueDate = parseDateLocal(task.due_date || formatDateLocal(new Date(task.created_at)));
    const checkDate = parseDateLocal(dateStr);
    return checkDate.getDate() === dueDate.getDate();
  }
  
  return false;
}

export interface SchedulingResult {
  tasks: Task[];
  rescheduledTasks: Array<{ task: Task; oldDate: string | null; newDate: string | null }>;
  warnings: string[];
}

// Assign start dates to unscheduled tasks
export function assignStartDates(
  tasks: Task[],
  categoryLimits: CategoryLimits,
  dailyMaxHours: DailyMaxHours,
  lookAheadDays: number = 90
): SchedulingResult {
  const warnings: string[] = [];
  const rescheduledTasks: Array<{ task: Task; oldDate: string | null; newDate: string | null }> = [];
  
  // Step 1: Keep completed tasks as-is
  const completedTasks = tasks.filter(t => t.completed);
  
  // Step 2: Keep recurring tasks - they already have start_date = due_date
  const recurringTasks = tasks.filter(t => !t.completed && t.is_recurring);
  
  // Step 3: Get ALL non-recurring tasks (both complete and incomplete) to track counts,
  // but only incomplete tasks will be rescheduled
  const allNonRecurringTasks = tasks.filter(t => !t.is_recurring);
  const nonRecurringTasks = allNonRecurringTasks.filter(t => !t.completed);
  const todayStr = getTodayLocal();
  
  // Step 3.5: Preserve tasks already scheduled for today
  // These should not be re-scheduled unless absolutely necessary
  const tasksAlreadyOnToday = nonRecurringTasks.filter(t => t.start_date === todayStr);
  const tasksToSchedule = nonRecurringTasks.filter(t => t.start_date !== todayStr);
  
  console.log('[v0] Re-scheduling', nonRecurringTasks.length, 'non-recurring tasks');
  console.log('[v0] Preserving', tasksAlreadyOnToday.length, 'tasks already on today');
  console.log('[v0] Re-scheduling', tasksToSchedule.length, 'other tasks');
  
  // Track original start_dates for comparison
  const originalDates = new Map(
    nonRecurringTasks.map(t => [t.id, t.start_date])
  );
  
  // Step 4: Score and sort by priority (highest first) - only for tasks to schedule
  const scoredTasksToSchedule = addPriorityScores(tasksToSchedule);
  scoredTasksToSchedule.sort((a, b) => b.priorityScore - a.priorityScore);
  
  console.log('[v0] Top 5 priorities:', scoredTasksToSchedule.slice(0, 5).map(t => ({
    title: t.title,
    score: t.priorityScore,
    quadrant: t.quadrant,
    due_date: t.due_date
  })));
  
  // Step 5: Start with completed tasks, recurring tasks, and tasks already on today
  const result: Task[] = [...completedTasks, ...recurringTasks, ...tasksAlreadyOnToday];
  
  // Initialize count per day with existing non-recurring tasks (including completed)
  const nonRecurringCountPerDay = new Map<string, number>();
  for (const task of allNonRecurringTasks) {
    if (task.start_date) {
      const count = nonRecurringCountPerDay.get(task.start_date) || 0;
      nonRecurringCountPerDay.set(task.start_date, count + 1);
    }
  }
  
  // Remove counts for tasks we're about to reschedule (incomplete non-recurring)
  for (const task of nonRecurringTasks) {
    if (task.start_date) {
      const count = nonRecurringCountPerDay.get(task.start_date) || 0;
      if (count > 0) {
        nonRecurringCountPerDay.set(task.start_date, count - 1);
      }
    }
  }
  
  // Step 6: Schedule each non-recurring task
  for (const task of scoredTasksToSchedule) {
    let scheduled = false;
    let attemptedDates: string[] = [];
    
    // Calculate max days to look ahead (up to due_date or lookAheadDays)
    const maxDayOffset = task.due_date 
      ? Math.min(
          Math.max(0, calculateDaysUntil(todayStr, task.due_date) + 1), // +1 to include due_date
          lookAheadDays
        )
      : lookAheadDays;
    
    // Try each day from today up to due_date (or max look-ahead)
    for (let dayOffset = 0; dayOffset < maxDayOffset && !scheduled; dayOffset++) {
      const dateStr = addDaysToDateString(todayStr, dayOffset);
      attemptedDates.push(dateStr);
      
      const nonRecurringCount = nonRecurringCountPerDay.get(dateStr) || 0;
      if (nonRecurringCount >= 4) {
        console.log('[v0] Skipping', dateStr, '- already has 4 non-recurring tasks');
        continue;
      }
      
      const weekend = isWeekend(dateStr);
      const category = task.category;
      
      // Get limits for this day and category
      const categoryLimit = weekend 
        ? categoryLimits[category].weekend 
        : categoryLimits[category].weekday;
      const dailyLimit = weekend 
        ? dailyMaxHours.weekend 
        : dailyMaxHours.weekday;
      
      // Check current capacity usage
      const categoryHours = getHoursUsedForCategory(dateStr, category, result);
      const totalHours = getTotalHoursUsed(dateStr, result);
      
      // Check if we can fit this task
      const canFitCategory = categoryHours + task.estimated_hours <= categoryLimit;
      const canFitDaily = totalHours + task.estimated_hours <= dailyLimit;
      
      if (canFitCategory && canFitDaily) {
        // Found a slot!
        const scheduledTask = { ...task, start_date: dateStr };
        result.push(scheduledTask);
        scheduled = true;
        
        nonRecurringCountPerDay.set(dateStr, nonRecurringCount + 1);
        
        // Track if this is a reschedule
        const oldDate = originalDates.get(task.id);
        if (oldDate !== dateStr) {
          rescheduledTasks.push({
            task: scheduledTask,
            oldDate,
            newDate: dateStr
          });
        }
        
        console.log('[v0] Scheduled', task.title, 'on', dateStr, '(priority:', task.priorityScore, ', non-recurring:', nonRecurringCount + 1, '/4)');
      }
    }
    
    // If still not scheduled and we limited by due date, try days beyond due date up to lookAhead
    if (
      !scheduled &&
      cappedDueWindow < lookAheadDays
    ) {
      for (let dayOffset = cappedDueWindow; dayOffset < lookAheadDays && !scheduled; dayOffset++) {
        const dateStr = addDaysToDateString(todayStr, dayOffset);
        attemptedDates.push(dateStr);
        
        const nonRecurringCount = nonRecurringCountPerDay.get(dateStr) || 0;
        if (nonRecurringCount >= 4) {
          console.log('[v0] Skipping', dateStr, '- already has 4 non-recurring tasks (post-due search)');
          continue;
        }
        
        const weekend = isWeekend(dateStr);
        const category = task.category;
        const categoryLimit = weekend 
          ? categoryLimits[category].weekend 
          : categoryLimits[category].weekday;
        const dailyLimit = weekend 
          ? dailyMaxHours.weekend 
          : dailyMaxHours.weekday;
        
        const categoryHours = getHoursUsedForCategory(dateStr, category, result);
        const totalHours = getTotalHoursUsed(dateStr, result);
        const canFitCategory = categoryHours + task.estimated_hours <= categoryLimit;
        const canFitDaily = totalHours + task.estimated_hours <= dailyLimit;
        
        if (canFitCategory && canFitDaily) {
          const finalCount = nonRecurringCountPerDay.get(dateStr) || 0;
          if (finalCount >= 4) {
            continue;
          }
          
          const scheduledTask = { ...task, start_date: dateStr };
          result.push(scheduledTask);
          scheduled = true;
          nonRecurringCountPerDay.set(dateStr, finalCount + 1);
          
          const oldDate = originalDates.get(task.id) ?? null;
          if (oldDate !== dateStr) {
            rescheduledTasks.push({
              task: scheduledTask,
              oldDate,
              newDate: dateStr
            });
            warnings.push(`Task "${task.title}" scheduled after due date on ${dateStr} to maintain daily limits.`);
          }
          
          console.log('[v0] Scheduled', task.title, 'on', dateStr, '(post-due slot)');
        }
      }
    }
    
    // If we couldn't schedule it, handle based on task type
    if (!scheduled) {
      if (task.due_date) {
        // Could not fit before due_date - try due_date first, but respect 4-task cap
        const dueDate = task.due_date;
        const dueDateCount = nonRecurringCountPerDay.get(dueDate) || 0;
        
        if (dueDateCount < 4) {
          // Due date has space - schedule there even if over capacity
          console.warn('[v0] Could not fit', task.title, 'before due date. Scheduling on', dueDate, '(over capacity)');
          
          const scheduledTask = { ...task, start_date: dueDate };
          result.push(scheduledTask);
          
          nonRecurringCountPerDay.set(dueDate, dueDateCount + 1);
          
          warnings.push(`Task "${task.title}" scheduled on due date (${dueDate}) but may exceed capacity limits.`);
          
          // Track reschedule
          const oldDate = originalDates.get(task.id) ?? null;
          if (oldDate !== dueDate) {
            rescheduledTasks.push({
              task: scheduledTask,
              oldDate,
              newDate: dueDate
            });
          }
        } else {
          // Due date is full - find next available day after due date
          const dueDateOffset = calculateDaysUntil(todayStr, dueDate);
          let foundSlot = false;
          
          for (let dayOffset = dueDateOffset + 1; dayOffset < lookAheadDays && !foundSlot; dayOffset++) {
            const dateStr = addDaysToDateString(todayStr, dayOffset);
            const dateCount = nonRecurringCountPerDay.get(dateStr) || 0;
            
            if (dateCount < 4) {
              // Found a slot after due date
              const scheduledTask = { ...task, start_date: dateStr };
              result.push(scheduledTask);
              foundSlot = true;
              
              nonRecurringCountPerDay.set(dateStr, dateCount + 1);
              
              warnings.push(`Task "${task.title}" scheduled on ${dateStr} (due date ${dueDate} was full).`);
              
              const oldDate = originalDates.get(task.id) ?? null;
              if (oldDate !== dateStr) {
                rescheduledTasks.push({
                  task: scheduledTask,
                  oldDate,
                  newDate: dateStr
                });
              }
              
              console.log('[v0] Scheduled', task.title, 'on', dateStr, '(due date was full)');
            }
          }
          
          if (!foundSlot) {
            // Couldn't find any slot - force to due date with warning
            console.warn('[v0] Could not find slot for', task.title, 'after due date. Forcing to', dueDate, '(exceeds 4-task limit)');
            
            const scheduledTask = { ...task, start_date: dueDate };
            result.push(scheduledTask);
            
            nonRecurringCountPerDay.set(dueDate, dueDateCount + 1);
            
            warnings.push(`Task "${task.title}" scheduled on due date (${dueDate}) but exceeds 4-task daily limit.`);
            
            const oldDate = originalDates.get(task.id) ?? null;
            if (oldDate !== dueDate) {
              rescheduledTasks.push({
                task: scheduledTask,
                oldDate,
                newDate: dueDate
              });
            }
          }
        }
      } else {
        // No due_date and couldn't fit - leave unscheduled
        console.warn('[v0] Could not schedule', task.title, '- no capacity and no due_date');
        result.push(task);
        warnings.push(`Task "${task.title}" could not be scheduled. Please adjust capacity limits or task duration.`);
      }
    } else if (!scheduled) {
      // No due_date and couldn't fit - leave unscheduled
      console.warn('[v0] Could not schedule', task.title, '- no capacity and no due_date');
      result.push(task);
      warnings.push(`Task "${task.title}" could not be scheduled. Please adjust capacity limits or task duration.`);
    }
  }
  
  console.log('[v0] Scheduling complete:', {
    total: result.length,
    scheduled: result.filter(t => t.start_date).length,
    rescheduled: rescheduledTasks.length,
    warnings: warnings.length
  });
  
  return {
    tasks: result,
    rescheduledTasks,
    warnings
  };
}

// Helper: Calculate days between two date strings
function calculateDaysUntil(fromDateStr: string, toDateStr: string): number {
  const from = parseDateLocal(fromDateStr);
  const to = parseDateLocal(toDateStr);
  const diffMs = to.getTime() - from.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Get today's focus tasks (max 4)
export function getTodaysFocusTasks(tasks: Task[]): Task[] {
  const todayStr = getTodayLocal();
  const BASELINE_TASKS = 4;
  
  console.log('[v0] getTodaysFocusTasks - today:', todayStr);
  
  // Filter for tasks scheduled for today
  const incompleteTodayTasks = tasks
    .filter(t => !t.completed && t.start_date === todayStr);
  
  const completedTodayTasks = tasks
    .filter(t => t.completed && t.start_date === todayStr);
  
  console.log('[v0] Incomplete today tasks:', incompleteTodayTasks.length);
  console.log('[v0] Completed today tasks:', completedTodayTasks.length);
  
  // Add priority scores and sort incomplete tasks
  const scoredIncompleteTasks = addPriorityScores(incompleteTodayTasks);
  scoredIncompleteTasks.sort((a, b) => b.priorityScore - a.priorityScore);
  
  // Return all tasks (no artificial limit on incomplete tasks)
  // Users can add as many as they want for "extra credit"
  return [...scoredIncompleteTasks, ...completedTodayTasks];
}

// Group tasks by start date
export function groupTasksByDate(tasks: Task[]): Map<string, Task[]> {
  const grouped = new Map<string, Task[]>();
  
  const incompleteTasks = tasks.filter(t => !t.completed && t.start_date);
  
  for (const task of incompleteTasks) {
    const date = task.start_date!;
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(task);
  }
  
  // Sort tasks within each date by priority score
  for (const [date, dateTasks] of grouped.entries()) {
    const scored = addPriorityScores(dateTasks);
    scored.sort((a, b) => b.priorityScore - a.priorityScore);
    grouped.set(date, scored);
  }
  
  return grouped;
}

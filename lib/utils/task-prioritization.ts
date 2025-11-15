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
  
  // Step 3: Get ALL non-recurring incomplete tasks (clear their start_dates for re-evaluation)
  const nonRecurringTasks = tasks.filter(t => !t.completed && !t.is_recurring);
  console.log('[v0] Re-scheduling', nonRecurringTasks.length, 'non-recurring tasks');
  
  // Track original start_dates for comparison
  const originalDates = new Map(
    nonRecurringTasks.map(t => [t.id, t.start_date])
  );
  
  // Step 4: Score and sort by priority (highest first)
  const scoredTasks = addPriorityScores(nonRecurringTasks);
  scoredTasks.sort((a, b) => b.priorityScore - a.priorityScore);
  
  console.log('[v0] Top 5 priorities:', scoredTasks.slice(0, 5).map(t => ({
    title: t.title,
    score: t.priorityScore,
    quadrant: t.quadrant,
    due_date: t.due_date
  })));
  
  // Step 5: Start with recurring tasks as "already scheduled"
  const result: Task[] = [...completedTasks, ...recurringTasks];
  const todayStr = getTodayLocal();
  
  // Step 6: Schedule each non-recurring task
  for (const task of scoredTasks) {
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
        
        // Track if this is a reschedule
        const oldDate = originalDates.get(task.id);
        if (oldDate !== dateStr) {
          rescheduledTasks.push({
            task: scheduledTask,
            oldDate,
            newDate: dateStr
          });
        }
        
        console.log('[v0] Scheduled', task.title, 'on', dateStr, '(priority:', task.priorityScore, ')');
      }
    }
    
    // If we couldn't schedule it before due_date, force schedule on due_date
    if (!scheduled && task.due_date) {
      const dueDate = task.due_date;
      console.warn('[v0] Could not fit', task.title, 'before due date. Scheduling on', dueDate, '(over capacity)');
      
      const scheduledTask = { ...task, start_date: dueDate };
      result.push(scheduledTask);
      
      warnings.push(`Task "${task.title}" scheduled on due date (${dueDate}) but may exceed capacity limits.`);
      
      // Track reschedule
      const oldDate = originalDates.get(task.id);
      if (oldDate !== dueDate) {
        rescheduledTasks.push({
          task: scheduledTask,
          oldDate,
          newDate: dueDate
        });
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
  
  console.log('[v0] getTodaysFocusTasks - today:', todayStr);
  console.log('[v0] All tasks:', tasks.map(t => ({ 
    id: t.id,
    name: t.title, 
    start_date: t.start_date, 
    completed: t.completed,
    due_date: t.due_date 
  })));
  
  // Filter for tasks scheduled for today only
  const incompleteTodayTasks = tasks
    .filter(t => {
      const matches = !t.completed && t.start_date === todayStr;
      if (t.start_date === todayStr) {
        console.log('[v0] Task', t.title, '- completed:', t.completed, 'matches:', matches);
      }
      return matches;
    });
  
  const completedTodayTasks = tasks
    .filter(t => {
      const matches = t.completed && t.start_date === todayStr;
      if (t.completed && t.start_date) {
        console.log('[v0] Completed task', t.title, '- start_date:', t.start_date, 'today:', todayStr, 'matches:', matches);
      }
      return matches;
    });
  
  console.log('[v0] Incomplete today tasks:', incompleteTodayTasks.map(t => t.title));
  console.log('[v0] Completed today tasks:', completedTodayTasks.map(t => t.title));
  
  // Add priority scores and sort
  const scoredIncompleteTasks = addPriorityScores(incompleteTodayTasks);
  scoredIncompleteTasks.sort((a, b) => b.priorityScore - a.priorityScore);
  
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

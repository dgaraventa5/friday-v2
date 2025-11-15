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

// Assign start dates to unscheduled tasks
export function assignStartDates(
  tasks: Task[],
  categoryLimits: CategoryLimits,
  dailyMaxHours: DailyMaxHours,
  lookAheadDays: number = 90
): Task[] {
  // Separate completed, scheduled, and unscheduled tasks
  const completedTasks = tasks.filter(t => t.completed);
  const scheduledTasks = tasks.filter(t => !t.completed && t.start_date);
  const unscheduledTasks = tasks.filter(t => !t.completed && !t.start_date);
  
  console.log('[v0] assignStartDates: unscheduled tasks:', unscheduledTasks.length);
  
  // Sort unscheduled tasks by priority score
  const scoredTasks = addPriorityScores(unscheduledTasks);
  scoredTasks.sort((a, b) => b.priorityScore - a.priorityScore);
  
  const result = [...completedTasks, ...scheduledTasks];
  const todayStr = getTodayLocal();
  
  // Try to schedule each task
  for (const task of scoredTasks) {
    let scheduled = false;
    
    // Try each day within the look-ahead window
    for (let dayOffset = 0; dayOffset < lookAheadDays && !scheduled; dayOffset++) {
      const dateStr = addDaysToDateString(todayStr, dayOffset);
      
      if (task.is_recurring && !shouldScheduleRecurringTask(task, dateStr)) {
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
      
      // Check if there's capacity
      const categoryHours = getHoursUsedForCategory(dateStr, category, result);
      const totalHours = getTotalHoursUsed(dateStr, result);
      
      // Check if we can fit this task
      if (
        categoryHours + task.estimated_hours <= categoryLimit &&
        totalHours + task.estimated_hours <= dailyLimit
      ) {
        console.log('[v0] Scheduling task', task.title, 'on', dateStr);
        result.push({ ...task, start_date: dateStr });
        scheduled = true;
      }
    }
    
    // If we couldn't schedule it, add it without a start date
    if (!scheduled) {
      console.log('[v0] Could not schedule task:', task.title);
      result.push(task);
    }
  }
  
  return result;
}

// Get today's focus tasks (max 4)
export function getTodaysFocusTasks(tasks: Task[]): Task[] {
  const todayStr = getTodayLocal();
  
  console.log('[v0] getTodaysFocusTasks - today:', todayStr);
  console.log('[v0] All tasks:', tasks.map(t => ({ name: t.title, start_date: t.start_date, completed: t.completed })));
  
  // Filter for tasks scheduled for today only
  const incompleteTodayTasks = tasks
    .filter(t => !t.completed && t.start_date === todayStr);
  
  const completedTodayTasks = tasks
    .filter(t => t.completed && t.start_date === todayStr);
  
  console.log('[v0] Incomplete today tasks:', incompleteTodayTasks.length);
  console.log('[v0] Completed today tasks:', completedTodayTasks.length);
  
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

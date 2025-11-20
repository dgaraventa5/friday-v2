import { Task, TaskWithScore, EisenhowerQuadrant, CategoryLimits, DailyMaxHours } from '@/lib/types';
import { getTodayLocal, formatDateLocal, parseDateLocal, compareDateStrings, addDaysToDateString, getDayOfWeek } from './date-utils';

// Eisenhower Matrix base scores
// These form the foundation of priority, representing the importance and urgency dimensions
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

/**
 * Calculate due date score using a continuous function to ensure smooth priority transitions.
 * 
 * Design principles:
 * - Overdue tasks get massive priority boost (prevents missed deadlines)
 * - Due today tasks get maximum urgency boost
 * - Continuous gradient from 1-30 days ensures no "cliff effects"
 * - Tasks 30+ days out still get small reminder bonus
 * 
 * Examples:
 * - Overdue by 2 days: +80 (50 + 2*15)
 * - Due today: +100
 * - Due in 3 days: +53 (80 * (7-3)/6 = 80 * 0.67)
 * - Due in 10 days: +34 (40 * (14-10)/7 = 40 * 0.57)
 * - Due in 20 days: +13 (20 * (30-20)/16 = 20 * 0.625)
 * - Due in 45 days: +5
 */
function calculateDueDateScore(task: Task): number {
  if (!task.due_date || task.completed) {
    return 0;
  }

  const todayStr = getTodayLocal();
  const today = parseDateLocal(todayStr);
  const dueDate = parseDateLocal(task.due_date);
  const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Overdue: Strong penalty that increases with time
  if (daysUntilDue < 0) {
    const daysOverdue = Math.abs(daysUntilDue);
    return 50 + (daysOverdue * 15);
  }

  // Due today: Maximum urgency
  if (daysUntilDue === 0) {
    return 100;
  }

  // Due in 1-7 days: High urgency with gradient
  if (daysUntilDue >= 1 && daysUntilDue <= 7) {
    return 80 * ((7 - daysUntilDue) / 6);
  }

  // Due in 8-14 days: Medium urgency with gradient
  if (daysUntilDue >= 8 && daysUntilDue <= 14) {
    return 40 * ((14 - daysUntilDue) / 7);
  }

  // Due in 15-30 days: Low but present urgency with gradient
  if (daysUntilDue >= 15 && daysUntilDue <= 30) {
    return 20 * ((30 - daysUntilDue) / 16);
  }

  // Due in 30+ days: Small constant reminder
  return 5;
}

/**
 * Calculate duration pressure factor to prioritize large tasks with approaching deadlines.
 * 
 * This ensures that tasks requiring significant time investment are scheduled with
 * sufficient lead time before their due dates.
 * 
 * Formula: (estimated_hours / max(days_until_due, 0.5)) × 15
 * 
 * Examples:
 * - 4-hour task due in 2 days: (4 / 2) * 15 = +30
 * - 1-hour task due in 2 days: (1 / 2) * 15 = +7.5
 * - 8-hour task due in 1 day: (8 / 1) * 15 = +120 (high urgency!)
 * - 2-hour task due in 10 days: (2 / 10) * 15 = +3
 * 
 * The 0.5 minimum prevents division by zero and ensures same-day tasks get high scores.
 */
function calculateDurationPressure(task: Task): number {
  if (!task.due_date || task.completed) {
    return 0;
  }

  const todayStr = getTodayLocal();
  const today = parseDateLocal(todayStr);
  const dueDate = parseDateLocal(task.due_date);
  const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Only apply pressure for future or today tasks (not overdue)
  if (daysUntilDue < 0) {
    return 0;
  }

  const daysRemaining = Math.max(daysUntilDue, 0.5);
  return (task.estimated_hours / daysRemaining) * 15;
}

/**
 * Calculate priority score for a task using a balanced, multi-factor approach.
 * 
 * Score Components:
 * 1. Base Score (40-100): Eisenhower matrix quadrant
 * 2. Due Date Score (0-100+): Continuous function based on time until due
 * 3. Duration Pressure (0-120+): Prioritizes large tasks with approaching deadlines
 * 4. Age Factor (0-10): Small bonus for older tasks to prevent starvation
 * 
 * Total possible range: ~40 to 330+ (extreme cases)
 * Typical range: 40-180 for most tasks
 * 
 * This design ensures:
 * - Tasks with due dates are prioritized appropriately across all time horizons
 * - Large tasks get scheduled with sufficient lead time
 * - Old tasks without due dates don't get forgotten
 * - No single factor dominates (balanced weighting)
 * - Smooth priority transitions (no sudden jumps)
 */
export function calculatePriorityScore(task: Task): number {
  const quadrant = getEisenhowerQuadrant(task);
  
  // 1. Base score from Eisenhower matrix (40-100)
  let score = QUADRANT_SCORES[quadrant];

  // 2. Due date component (0-100+)
  const dueDateScore = calculateDueDateScore(task);
  score += dueDateScore;

  // 3. Duration pressure factor (0-120+)
  const durationPressure = calculateDurationPressure(task);
  score += durationPressure;

  // 4. Age factor: Reduced from +2/day max +20 to +1/day max +10
  // This prevents old tasks from overshadowing tasks with actual deadlines
  const todayStr = getTodayLocal();
  const today = parseDateLocal(todayStr);
  const createdDate = new Date(task.created_at);
  createdDate.setHours(0, 0, 0, 0);
  
  const daysOld = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const ageBonus = Math.min(daysOld * 1, 10); // Reduced impact
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
  
  console.log('[v1] Re-scheduling', nonRecurringTasks.length, 'incomplete non-recurring tasks');
  
  // Track original start_dates for comparison
  const originalDates = new Map(
    nonRecurringTasks.map(t => [t.id, t.start_date])
  );
  
  // Step 4: Score and sort by priority (highest first)
  const scoredTasksToSchedule = addPriorityScores(nonRecurringTasks);
  scoredTasksToSchedule.sort((a, b) => b.priorityScore - a.priorityScore);
  
  console.log('[v1] Top 5 priorities:', scoredTasksToSchedule.slice(0, 5).map(t => ({
    title: t.title,
    score: t.priorityScore,
    quadrant: t.quadrant,
    due_date: t.due_date,
    current_start: t.start_date
  })));
  
  // Step 5: Start with completed tasks and recurring tasks only
  const result: Task[] = [...completedTasks, ...recurringTasks];
  
  // Initialize count per day with ALL tasks (both recurring and non-recurring, complete and incomplete)
  // This is the critical change: we now count ALL tasks toward the 4-task daily cap
  const tasksPerDay = new Map<string, number>();
  
  // Seed with all existing tasks
  for (const task of tasks) {
    if (task.start_date) {
      const count = tasksPerDay.get(task.start_date) || 0;
      tasksPerDay.set(task.start_date, count + 1);
    }
  }
  
  console.log('[v1] Initial task counts per day:', Array.from(tasksPerDay.entries()).slice(0, 10));
  
  // Remove counts for all incomplete non-recurring tasks we're about to reschedule
  for (const task of nonRecurringTasks) {
    if (task.start_date) {
      const count = tasksPerDay.get(task.start_date) || 0;
      if (count > 0) {
        tasksPerDay.set(task.start_date, count - 1);
      }
    }
  }
  
  console.log('[v1] After releasing slots for rescheduling:', Array.from(tasksPerDay.entries()).slice(0, 10));
  
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
      
      const totalTaskCount = tasksPerDay.get(dateStr) || 0;
      if (totalTaskCount >= 4) {
        console.log('[v1] Skipping', dateStr, '- already has 4 tasks (any type)');
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
        
        tasksPerDay.set(dateStr, totalTaskCount + 1);
        
        // Track if this is a reschedule
        const oldDate = originalDates.get(task.id);
        if (oldDate !== dateStr) {
          rescheduledTasks.push({
            task: scheduledTask,
            oldDate,
            newDate: dateStr
          });
        }
        
        console.log('[v1] Scheduled', task.title, 'on', dateStr, '(priority:', task.priorityScore, ', total tasks:', totalTaskCount + 1, '/4)');
      }
    }
    
    // If still not scheduled and we limited by due date, try days beyond due date up to lookAhead
    if (
      !scheduled &&
      maxDayOffset < lookAheadDays
    ) {
      for (let dayOffset = maxDayOffset; dayOffset < lookAheadDays && !scheduled; dayOffset++) {
        const dateStr = addDaysToDateString(todayStr, dayOffset);
        attemptedDates.push(dateStr);
        
        const totalTaskCount = tasksPerDay.get(dateStr) || 0;
        if (totalTaskCount >= 4) {
          console.log('[v1] Skipping', dateStr, '- already has 4 tasks (post-due search)');
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
          const finalCount = tasksPerDay.get(dateStr) || 0;
          if (finalCount >= 4) {
            continue;
          }
          
          const scheduledTask = { ...task, start_date: dateStr };
          result.push(scheduledTask);
          scheduled = true;
          tasksPerDay.set(dateStr, finalCount + 1);
          
          const oldDate = originalDates.get(task.id) ?? null;
          if (oldDate !== dateStr) {
            rescheduledTasks.push({
              task: scheduledTask,
              oldDate,
              newDate: dateStr
            });
            warnings.push(`Task "${task.title}" scheduled after due date on ${dateStr} to maintain daily limits.`);
          }
          
          console.log('[v1] Scheduled', task.title, 'on', dateStr, '(post-due slot)');
        }
      }
    }
    
    // If we couldn't schedule it, handle based on task type
    if (!scheduled) {
      if (task.due_date) {
        // Could not fit before due_date - try due_date first, but respect 4-task cap
        const dueDate = task.due_date;
        const dueDateCount = tasksPerDay.get(dueDate) || 0;
        
        if (dueDateCount < 4) {
          // Due date has space - schedule there even if over capacity
          console.warn('[v1] Could not fit', task.title, 'before due date. Scheduling on', dueDate, '(over capacity)');
          
          const scheduledTask = { ...task, start_date: dueDate };
          result.push(scheduledTask);
          
          tasksPerDay.set(dueDate, dueDateCount + 1);
          
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
            const dateCount = tasksPerDay.get(dateStr) || 0;
            
            if (dateCount < 4) {
              // Found a slot after due date
              const scheduledTask = { ...task, start_date: dateStr };
              result.push(scheduledTask);
              foundSlot = true;
              
              tasksPerDay.set(dateStr, dateCount + 1);
              
              warnings.push(`Task "${task.title}" scheduled on ${dateStr} (due date ${dueDate} was full).`);
              
              const oldDate = originalDates.get(task.id) ?? null;
              if (oldDate !== dateStr) {
                rescheduledTasks.push({
                  task: scheduledTask,
                  oldDate,
                  newDate: dateStr
                });
              }
              
              console.log('[v1] Scheduled', task.title, 'on', dateStr, '(due date was full)');
            }
          }
          
          if (!foundSlot) {
            // Couldn't find any slot - force to due date with warning
            console.warn('[v1] Could not find slot for', task.title, 'after due date. Forcing to', dueDate, '(exceeds 4-task limit)');
            
            const scheduledTask = { ...task, start_date: dueDate };
            result.push(scheduledTask);
            
            tasksPerDay.set(dueDate, dueDateCount + 1);
            
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
        console.warn('[v1] Could not schedule', task.title, '- no capacity and no due_date');
        result.push(task);
        warnings.push(`Task "${task.title}" could not be scheduled. Please adjust capacity limits or task duration.`);
      }
    } else if (!scheduled) {
      // No due_date and couldn't fit - leave unscheduled
      console.warn('[v1] Could not schedule', task.title, '- no capacity and no due_date');
      result.push(task);
      warnings.push(`Task "${task.title}" could not be scheduled. Please adjust capacity limits or task duration.`);
    }
  }
  
  // Final count verification
  const finalCounts = new Map<string, number>();
  for (const task of result) {
    if (task.start_date) {
      const count = finalCounts.get(task.start_date) || 0;
      finalCounts.set(task.start_date, count + 1);
    }
  }
  
  console.log('[v1] Final task counts per day:', Array.from(finalCounts.entries()).slice(0, 10));
  console.log('[v1] Today count:', finalCounts.get(todayStr) || 0);
  
  console.log('[v1] Scheduling complete:', {
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

// Get today's focus tasks (max 4 total including completed)
export function getTodaysFocusTasks(tasks: Task[]): Task[] {
  const todayStr = getTodayLocal();
  const MAX_TASKS = 4;
  
  console.log('[v1] getTodaysFocusTasks - today:', todayStr);
  
  // Filter for tasks scheduled for today
  const incompleteTodayTasks = tasks
    .filter(t => !t.completed && t.start_date === todayStr);
  
  const completedTodayTasks = tasks
    .filter(t => t.completed && t.start_date === todayStr);
  
  console.log('[v1] Raw incomplete today tasks:', incompleteTodayTasks.length);
  console.log('[v1] Raw completed today tasks:', completedTodayTasks.length);
  console.log('[v1] Total:', incompleteTodayTasks.length + completedTodayTasks.length);
  
  // Add priority scores and sort incomplete tasks
  const scoredIncompleteTasks = addPriorityScores(incompleteTodayTasks);
  scoredIncompleteTasks.sort((a, b) => b.priorityScore - a.priorityScore);
  
  // CRITICAL: Enforce max 4 tasks total (completed + incomplete)
  // Completed tasks "hold their slots" - they earned them by being completed
  const slotsRemaining = MAX_TASKS - completedTodayTasks.length;
  const cappedIncompleteTasks = scoredIncompleteTasks.slice(0, Math.max(0, slotsRemaining));
  
  console.log('[v1] Slots remaining after completed:', slotsRemaining);
  console.log('[v1] Capped incomplete tasks:', cappedIncompleteTasks.length);
  console.log('[v1] Final total:', cappedIncompleteTasks.length + completedTodayTasks.length);
  
  if (scoredIncompleteTasks.length > cappedIncompleteTasks.length) {
    console.warn('[v1] Had to cap incomplete tasks from', scoredIncompleteTasks.length, 'to', cappedIncompleteTasks.length);
  }
  
  return [...cappedIncompleteTasks, ...completedTodayTasks];
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

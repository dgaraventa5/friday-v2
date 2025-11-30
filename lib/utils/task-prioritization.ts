import { Task, TaskWithScore, EisenhowerQuadrant, CategoryLimits, DailyMaxHours, DailyMaxTasks } from '@/lib/types';
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
 * Calculate due date score using exponential multipliers as deadlines approach.
 * 
 * Design principles:
 * - Important tasks (Eisenhower) dominate when deadlines are far away
 * - Deadline pressure naturally overtakes importance as time runs out
 * - Overdue tasks always bubble to the top regardless of quadrant
 * - Smooth gradients within each tier prevent cliff effects
 * 
 * Multiplier tiers:
 * - Overdue:     8x base + escalation → 200+ (guarantees top priority)
 * - Due today:   6x → 150
 * - 1-3 days:    4x → ~100-140
 * - 4-7 days:    2x → ~50-90
 * - 8-14 days:   1.5x → ~25-50
 * - 15-30 days:  1x → ~5-20
 * - 30+ days:    1x → 5
 * 
 * Examples:
 * - Overdue by 1 day: +225 (200 + 1*25)
 * - Overdue by 3 days: +275 (200 + 3*25)
 * - Due today: +150
 * - Due in 1 day: +140 (100 + 40*1)
 * - Due in 3 days: +100 (100 + 40*0)
 * - Due in 5 days: +77 (50 + 40*(2/3))
 * - Due in 10 days: +42 (25 + 25*(4/6))
 * - Due in 20 days: +15 (5 + 15*(10/15))
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

  // Overdue: 8x multiplier with escalation - guarantees top priority
  // Base 200 + 25 per day overdue ensures overdue tasks always win
  if (daysUntilDue < 0) {
    const daysOverdue = Math.abs(daysUntilDue);
    return 200 + (daysOverdue * 25);
  }

  // Due today: 6x multiplier - very high urgency
  if (daysUntilDue === 0) {
    return 150;
  }

  // Due in 1-3 days: 4x multiplier - high urgency with gradient
  // Gradient: 140 (1 day) → 100 (3 days)
  if (daysUntilDue >= 1 && daysUntilDue <= 3) {
    return 100 + (40 * ((3 - daysUntilDue) / 2));
  }

  // Due in 4-7 days: 2x multiplier - moderate urgency with gradient
  // Gradient: 90 (4 days) → 50 (7 days)
  if (daysUntilDue >= 4 && daysUntilDue <= 7) {
    return 50 + (40 * ((7 - daysUntilDue) / 3));
  }

  // Due in 8-14 days: 1.5x multiplier - mild urgency with gradient
  // Gradient: 50 (8 days) → 25 (14 days)
  if (daysUntilDue >= 8 && daysUntilDue <= 14) {
    return 25 + (25 * ((14 - daysUntilDue) / 6));
  }

  // Due in 15-30 days: 1x multiplier - low urgency with gradient
  // Gradient: 20 (15 days) → 5 (30 days)
  if (daysUntilDue >= 15 && daysUntilDue <= 30) {
    return 5 + (15 * ((30 - daysUntilDue) / 15));
  }

  // Due in 30+ days: minimal reminder
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
  dailyMaxTasks: DailyMaxTasks = { weekday: 4, weekend: 4 },
  lookAheadDays: number = 90
): SchedulingResult {
  const warnings: string[] = [];
  const rescheduledTasks: Array<{ task: Task; oldDate: string | null; newDate: string | null }> = [];
  
  // Step 1: Keep completed tasks as-is
  const completedTasks = tasks.filter(t => t.completed);
  
  // Step 2: Keep recurring tasks - they already have start_date = due_date
  const rawRecurringTasks = tasks.filter(t => !t.completed && t.is_recurring);
  
  // Step 2a: Deduplicate recurring tasks with the same start_date and recurring_series_id
  // This prevents multiple instances of the same recurring series from appearing on the same day
  const recurringTasksMap = new Map<string, Task>();
  const duplicatesFound: string[] = [];
  
  for (const task of rawRecurringTasks) {
    if (!task.start_date || !task.recurring_series_id) {
      recurringTasksMap.set(task.id, task);
      continue;
    }
    
    // Create a unique key for this date + series combination
    const key = `${task.start_date}:${task.recurring_series_id}`;
    
    if (recurringTasksMap.has(key)) {
      // Duplicate found - keep the one with the earlier created_at (first instance)
      const existing = recurringTasksMap.get(key)!;
      const existingCreatedAt = new Date(existing.created_at).getTime();
      const currentCreatedAt = new Date(task.created_at).getTime();
      
      if (currentCreatedAt < existingCreatedAt) {
        // Current task is older, replace the existing one
        duplicatesFound.push(`${task.title} on ${task.start_date} (kept older instance)`);
        recurringTasksMap.set(key, task);
      } else {
        duplicatesFound.push(`${task.title} on ${task.start_date} (removed duplicate)`);
      }
    } else {
      recurringTasksMap.set(key, task);
    }
  }
  
  const recurringTasks = Array.from(recurringTasksMap.values());
  
  if (duplicatesFound.length > 0) {
    console.warn('[v1] Found and removed', duplicatesFound.length, 'duplicate recurring task instances:');
    duplicatesFound.forEach(msg => console.warn('  -', msg));
  }
  
  console.log('[v1] Recurring tasks after deduplication:', recurringTasks.length, '(was', rawRecurringTasks.length, ')');
  
  const todayStr = getTodayLocal();
  
  // Step 3: Keep tasks that are pinned for TODAY (user manually pulled them)
  // Pinned tasks are only respected for the current day - on a new day they get rescheduled
  const pinnedTodayTasks = tasks.filter(t => 
    !t.completed && 
    !t.is_recurring && 
    t.pinned_date === todayStr
  );
  
  console.log('[v1] Tasks pinned for today:', pinnedTodayTasks.length);
  
  // Step 4: Get ALL non-recurring tasks (both complete and incomplete) to track counts,
  // but only incomplete NON-PINNED tasks will be rescheduled
  const allNonRecurringTasks = tasks.filter(t => !t.is_recurring);
  const nonRecurringTasks = allNonRecurringTasks.filter(t => 
    !t.completed && 
    t.pinned_date !== todayStr  // Exclude tasks pinned for today
  );
  
  console.log('[v1] Re-scheduling', nonRecurringTasks.length, 'incomplete non-recurring tasks (excluding', pinnedTodayTasks.length, 'pinned)');
  
  // Track original start_dates for comparison
  const originalDates = new Map(
    nonRecurringTasks.map(t => [t.id, t.start_date])
  );
  
  // Step 5: Score and sort by priority (highest first)
  const scoredTasksToSchedule = addPriorityScores(nonRecurringTasks);
  scoredTasksToSchedule.sort((a, b) => b.priorityScore - a.priorityScore);
  
  console.log('[v1] Top 5 priorities:', scoredTasksToSchedule.slice(0, 5).map(t => ({
    title: t.title,
    score: t.priorityScore,
    quadrant: t.quadrant,
    due_date: t.due_date,
    current_start: t.start_date
  })));
  
  // Step 6: Start with completed tasks, recurring tasks, AND pinned tasks (all kept as-is)
  const result: Task[] = [...completedTasks, ...recurringTasks, ...pinnedTodayTasks];
  
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
  
  // Step 7: Schedule each non-recurring, non-pinned task
  for (const task of scoredTasksToSchedule) {
    let scheduled = false;
    let attemptedDates: string[] = [];
    
    console.log(`[v1] Attempting to schedule: "${task.title}" (${task.category}, ${task.estimated_hours}h, priority: ${task.priorityScore})`);
    
    // Calculate max days to look ahead (up to due_date or lookAheadDays)
    const maxDayOffset = task.due_date 
      ? Math.min(
          // If overdue, schedule from today onwards for full lookAheadDays
          // If not overdue, schedule from today up to due_date
          calculateDaysUntil(todayStr, task.due_date) < 0 
            ? lookAheadDays 
            : Math.max(0, calculateDaysUntil(todayStr, task.due_date) + 1), // +1 to include due_date
          lookAheadDays
        )
      : lookAheadDays;
    
    // Try each day from today up to due_date (or max look-ahead)
    for (let dayOffset = 0; dayOffset < maxDayOffset && !scheduled; dayOffset++) {
      const dateStr = addDaysToDateString(todayStr, dayOffset);
      attemptedDates.push(dateStr);
      
      const weekend = isWeekend(dateStr);
      const maxTasksForDay = weekend ? dailyMaxTasks.weekend : dailyMaxTasks.weekday;
      const totalTaskCount = tasksPerDay.get(dateStr) || 0;
      
      if (totalTaskCount >= maxTasksForDay) {
        console.log('[v1] Skipping', dateStr, `- already has ${maxTasksForDay} tasks (${weekend ? 'weekend' : 'weekday'} limit)`);
        continue;
      }
      
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
      
      console.log(`[v1]   Checking ${dateStr} (${weekend ? 'weekend' : 'weekday'}):`, {
        tasks: `${totalTaskCount}/${maxTasksForDay}`,
        categoryHours: `${categoryHours.toFixed(1)}/${categoryLimit}h`,
        totalHours: `${totalHours.toFixed(1)}/${dailyLimit}h`,
        canFit: canFitCategory && canFitDaily
      });
      
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
        
        console.log(`[v1] ✓ Scheduled "${task.title}" on ${dateStr} (priority: ${task.priorityScore}, tasks: ${totalTaskCount + 1}/${maxTasksForDay})`);
      } else {
        console.log(`[v1]   Cannot fit: category ${canFitCategory ? '✓' : '✗'}, daily ${canFitDaily ? '✓' : '✗'}`);
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
        
        const weekend = isWeekend(dateStr);
        const maxTasksForDay = weekend ? dailyMaxTasks.weekend : dailyMaxTasks.weekday;
        const totalTaskCount = tasksPerDay.get(dateStr) || 0;
        
        if (totalTaskCount >= maxTasksForDay) {
          console.log('[v1] Skipping', dateStr, `- already has ${maxTasksForDay} tasks (post-due search)`);
          continue;
        }
        
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
          const weekend2 = isWeekend(dateStr);
          const maxTasksForDay2 = weekend2 ? dailyMaxTasks.weekend : dailyMaxTasks.weekday;
          const finalCount = tasksPerDay.get(dateStr) || 0;
          if (finalCount >= maxTasksForDay2) {
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
        // Could not fit before due_date - try due_date first, but respect task cap
        const dueDate = task.due_date;
        const dueDateWeekend = isWeekend(dueDate);
        const maxTasksForDueDate = dueDateWeekend ? dailyMaxTasks.weekend : dailyMaxTasks.weekday;
        const dueDateCount = tasksPerDay.get(dueDate) || 0;
        
        if (dueDateCount < maxTasksForDueDate) {
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
            const dateWeekend = isWeekend(dateStr);
            const maxTasksForDate = dateWeekend ? dailyMaxTasks.weekend : dailyMaxTasks.weekday;
            const dateCount = tasksPerDay.get(dateStr) || 0;
            
            if (dateCount < maxTasksForDate) {
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
            
            warnings.push(`Task "${task.title}" scheduled on due date (${dueDate}) but exceeds ${maxTasksForDueDate}-task daily limit.`);
            
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

// Get today's focus tasks (all tasks scheduled for today)
// Note: The 4-task limit is enforced during automatic scheduling in assignStartDates(),
// not here. This allows users to manually pull additional tasks when they choose to.
export function getTodaysFocusTasks(tasks: Task[]): Task[] {
  const todayStr = getTodayLocal();
  
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
  
  // Return all tasks scheduled for today, sorted by priority
  // The 4-task cap is handled during scheduling, not display
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

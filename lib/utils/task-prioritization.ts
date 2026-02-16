import { Task, TaskWithScore, EisenhowerQuadrant, CategoryLimits, DailyMaxHours, DailyMaxTasks } from '@/lib/types';
import { getTodayLocal, formatDateLocal, parseDateLocal, compareDateStrings, addDaysToDateString, getDayOfWeek } from './date-utils';
import {
  SchedulingContext,
  partitionTasks,
  deduplicateRecurringTasks,
  scheduleTasksGreedy,
  type SchedulingOptions,
} from './scheduling';

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
  const todayStr = getTodayLocal();
  const warnings: string[] = [];
  const rescheduledTasks: Array<{ task: Task; oldDate: string | null; newDate: string | null }> = [];

  // Step 1: Partition tasks into completed, recurring, pinned, and to-schedule groups
  const { completed, recurring, pinned, toSchedule } = partitionTasks(tasks, todayStr);

  // Step 2: Deduplicate recurring tasks
  const { tasks: deduplicatedRecurring, duplicatesFound } = deduplicateRecurringTasks(recurring);
  if (duplicatesFound.length > 0) {
    console.log('[Scheduling] Removed', duplicatesFound.length, 'duplicate recurring tasks');
  }

  // Step 3: Set up capacity tracking context
  const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);

  // Seed with tasks that are already scheduled and won't be rescheduled
  // NOTE: Include completed tasks in capacity tracking - they took time/capacity during
  // the day and should count toward daily limits
  console.log('[Scheduling] Seeding context with existing tasks:', {
    completed: completed.length,
    recurring: deduplicatedRecurring.length,
    pinned: pinned.length,
    total: completed.length + deduplicatedRecurring.length + pinned.length
  });
  console.log('[Scheduling] Completed tasks for today:', completed.filter(t => t.start_date === todayStr).map(t => t.title));
  context.seedWithExistingTasks([...completed, ...deduplicatedRecurring, ...pinned]);
  console.log('[Scheduling] Capacity after seeding for today:', context.getDebugInfo(todayStr));
  console.log('[Scheduling] Tasks to schedule:', toSchedule.length, 'tasks');

  // Step 4: Score and sort tasks by priority (highest first)
  const scoredTasks = addPriorityScores(toSchedule);
  scoredTasks.sort((a, b) => b.priorityScore - a.priorityScore);

  console.log('[Scheduling] Top 5 priorities:', scoredTasks.slice(0, 5).map(t => ({
    title: t.title,
    score: t.priorityScore,
    quadrant: t.quadrant,
    due_date: t.due_date,
    current_start: t.start_date
  })));

  // Step 5: Schedule tasks using greedy algorithm
  const options: SchedulingOptions = {
    todayStr,
    lookAheadDays,
    categoryLimits,
    dailyMaxHours,
    dailyMaxTasks,
  };

  const { scheduled, warnings: schedulingWarnings } = scheduleTasksGreedy(
    scoredTasks,
    context,
    options
  );

  warnings.push(...schedulingWarnings);

  // Step 6: Track rescheduled tasks
  scheduled.forEach(task => {
    const originalDate = toSchedule.find(t => t.id === task.id)?.start_date ?? null;
    if (originalDate !== task.start_date) {
      rescheduledTasks.push({
        task,
        oldDate: originalDate,
        newDate: task.start_date,
      });
    }
  });

  // Step 7: Combine all tasks
  const result = [...completed, ...deduplicatedRecurring, ...pinned, ...scheduled];

  console.log('[Scheduling] Complete:', {
    total: result.length,
    scheduled: scheduled.length,
    rescheduled: rescheduledTasks.length,
    warnings: warnings.length,
  });

  return {
    tasks: result,
    rescheduledTasks,
    warnings,
  };
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

// ─────────────────────────────────────────────────────────────
// Score Breakdown & Priority Reason utilities
// ─────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  base: number;       // Eisenhower quadrant (40-100)
  deadline: number;   // Due date pressure (0-200+)
  duration: number;   // Duration pressure (0-120+)
  age: number;        // Age factor (0-10)
  total: number;      // Sum of all components
}

/**
 * Get a breakdown of all scoring components for a task.
 * Uses the same logic as calculatePriorityScore but returns each factor separately.
 */
export function getScoreBreakdown(task: Task): ScoreBreakdown {
  const quadrant = getEisenhowerQuadrant(task);
  const base = QUADRANT_SCORES[quadrant];
  const deadline = calculateDueDateScore(task);
  const duration = calculateDurationPressure(task);

  // Age factor — same logic as calculatePriorityScore
  const todayStr = getTodayLocal();
  const today = parseDateLocal(todayStr);
  const createdDate = new Date(task.created_at);
  createdDate.setHours(0, 0, 0, 0);
  const daysOld = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const age = Math.min(daysOld * 1, 10);

  return {
    base,
    deadline,
    duration,
    age,
    total: base + deadline + duration + age,
  };
}

/**
 * Get a human-readable one-line reason explaining why a task is ranked where it is.
 *
 * Priority of reasons (first match wins):
 * 1. Completed
 * 2. Overdue by X day(s)
 * 3. Due today
 * 4. Due tomorrow (with duration note if >= 4h)
 * 5. Due in X days (within 3 days, with duration note if >= 4h)
 * 6. Due in X days (within 7 days)
 * 7. Quadrant-based label
 * 8. Aging X days (age >= 3)
 * 9. Default: "Scheduled today"
 */
export function getPriorityReason(task: Task): string {
  // 1. Completed
  if (task.completed) {
    return 'Completed';
  }

  // Check deadline-related reasons
  if (task.due_date) {
    const todayStr = getTodayLocal();
    const today = parseDateLocal(todayStr);
    const dueDate = parseDateLocal(task.due_date);
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // 2. Overdue
    if (daysUntilDue < 0) {
      const daysOverdue = Math.abs(daysUntilDue);
      return `Overdue by ${daysOverdue} day${daysOverdue === 1 ? '' : 's'}`;
    }

    // 3. Due today
    if (daysUntilDue === 0) {
      return 'Due today';
    }

    // 4. Due tomorrow
    if (daysUntilDue === 1) {
      if (task.estimated_hours >= 4) {
        return `${task.estimated_hours}h task, due tomorrow`;
      }
      return 'Due tomorrow';
    }

    // 5. Due within 3 days (2-3 days out)
    if (daysUntilDue <= 3) {
      if (task.estimated_hours >= 4) {
        return `${task.estimated_hours}h task, due in ${daysUntilDue} days`;
      }
      return `Due in ${daysUntilDue} days`;
    }

    // 6. Due within 7 days
    if (daysUntilDue <= 7) {
      return `Due in ${daysUntilDue} days`;
    }
  }

  // 7. Quadrant-based reason
  const quadrant = getEisenhowerQuadrant(task);
  if (quadrant === 'urgent-important') {
    return 'Urgent + Important';
  }
  if (quadrant === 'not-urgent-important') {
    return 'High impact';
  }
  if (quadrant === 'urgent-not-important') {
    return 'Urgent';
  }

  // 8. Age >= 3 days
  const todayStr = getTodayLocal();
  const today = parseDateLocal(todayStr);
  const createdDate = new Date(task.created_at);
  createdDate.setHours(0, 0, 0, 0);
  const daysOld = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysOld >= 3) {
    return `Aging ${daysOld} days`;
  }

  // 9. Default
  return 'Scheduled today';
}

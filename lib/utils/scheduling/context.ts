import { Task, CategoryLimits, DailyMaxHours, DailyMaxTasks } from '@/lib/types';
import { getDayOfWeek } from '../date-utils';
import { CapacityCheckResult } from './types';

/**
 * SchedulingContext encapsulates capacity tracking for task scheduling.
 * Provides O(1) capacity checks instead of O(n) array filtering.
 *
 * Tracks three types of capacity:
 * 1. Task count per day (e.g., max 4 tasks/day)
 * 2. Category hours per day (e.g., max 3 hours of "Work" per day)
 * 3. Total hours per day (e.g., max 8 hours total per day)
 */
export class SchedulingContext {
  // Task count per date: Map<dateStr, count>
  private tasksPerDay: Map<string, number>;

  // Category hours per date: Map<dateStr, Map<category, hours>>
  private categoryHoursPerDay: Map<string, Map<string, number>>;

  // Total hours per date: Map<dateStr, hours>
  private totalHoursPerDay: Map<string, number>;

  // Configuration
  private categoryLimits: CategoryLimits;
  private dailyMaxHours: DailyMaxHours;
  private dailyMaxTasks: DailyMaxTasks;

  constructor(
    categoryLimits: CategoryLimits,
    dailyMaxHours: DailyMaxHours,
    dailyMaxTasks: DailyMaxTasks
  ) {
    this.tasksPerDay = new Map();
    this.categoryHoursPerDay = new Map();
    this.totalHoursPerDay = new Map();
    this.categoryLimits = categoryLimits;
    this.dailyMaxHours = dailyMaxHours;
    this.dailyMaxTasks = dailyMaxTasks;
  }

  /**
   * Seed the context with existing tasks to establish baseline capacity.
   * Call this once during initialization.
   *
   * @param tasks - Completed, recurring, and pinned tasks that are already scheduled
   */
  seedWithExistingTasks(tasks: Task[]): void {
    for (const task of tasks) {
      if (task.start_date) {
        this.reserveCapacity(task.start_date, task);
      }
    }
  }

  /**
   * Check if a task can fit on a specific date.
   * Returns detailed capacity information for debugging.
   *
   * Complexity: O(1)
   *
   * @param date - Date string (YYYY-MM-DD)
   * @param task - Task to check
   * @returns CapacityCheckResult with canFit boolean and capacity details
   */
  canFitTask(date: string, task: Task): CapacityCheckResult {
    const weekend = this.isWeekend(date);
    const maxTasks = this.getMaxTasksForDate(date);
    const taskCount = this.getTaskCount(date);

    const category = task.category || 'uncategorized';
    const categoryLimit = this.getCategoryLimit(date, category);
    const categoryHours = this.getCategoryHours(date, category);

    const dailyLimit = this.getDailyLimit(date);
    const totalHours = this.getTotalHours(date);

    // Check all three constraints
    const reasons: string[] = [];
    const taskCountOk = taskCount < maxTasks;
    const categoryOk = categoryHours + task.estimated_hours <= categoryLimit;
    const dailyOk = totalHours + task.estimated_hours <= dailyLimit;

    if (!taskCountOk) {
      reasons.push(`Task count (${taskCount}/${maxTasks})`);
    }
    if (!categoryOk) {
      reasons.push(`Category hours (${categoryHours.toFixed(1)}+${task.estimated_hours}>${categoryLimit})`);
    }
    if (!dailyOk) {
      reasons.push(`Daily hours (${totalHours.toFixed(1)}+${task.estimated_hours}>${dailyLimit})`);
    }

    return {
      canFit: taskCountOk && categoryOk && dailyOk,
      taskCount,
      categoryHours,
      totalHours,
      maxTasks,
      categoryLimit,
      dailyLimit,
      reasons: reasons.length > 0 ? reasons : undefined,
    };
  }

  /**
   * Seed the context with existing tasks that won't be rescheduled.
   * This reserves capacity for completed, recurring, and pinned tasks.
   *
   * Complexity: O(n) where n = number of tasks
   *
   * @param tasks - Tasks to seed the context with
   */
  seedWithExistingTasks(tasks: Task[]): void {
    for (const task of tasks) {
      if (task.start_date) {
        this.reserveCapacity(task.start_date, task);
      }
    }
  }

  /**
   * Reserve capacity for a task on a specific date.
   * Updates all capacity maps.
   *
   * Complexity: O(1)
   *
   * @param date - Date string (YYYY-MM-DD)
   * @param task - Task to reserve capacity for
   */
  reserveCapacity(date: string, task: Task): void {
    // Update task count
    const count = this.tasksPerDay.get(date) || 0;
    this.tasksPerDay.set(date, count + 1);

    // Update category hours
    const category = task.category || 'uncategorized';
    if (!this.categoryHoursPerDay.has(date)) {
      this.categoryHoursPerDay.set(date, new Map());
    }
    const categoryMap = this.categoryHoursPerDay.get(date)!;
    const categoryHours = categoryMap.get(category) || 0;
    categoryMap.set(category, categoryHours + task.estimated_hours);

    // Update total hours
    const totalHours = this.totalHoursPerDay.get(date) || 0;
    this.totalHoursPerDay.set(date, totalHours + task.estimated_hours);
  }

  /**
   * Release capacity for a task (used when rescheduling).
   * Decrements all capacity maps.
   *
   * Complexity: O(1)
   *
   * @param task - Task to release capacity for
   */
  releaseTaskCapacity(task: Task): void {
    if (!task.start_date) return;

    const date = task.start_date;

    // Decrement task count
    const count = this.tasksPerDay.get(date) || 0;
    if (count > 0) {
      this.tasksPerDay.set(date, count - 1);
    }

    // Decrement category hours
    const category = task.category || 'uncategorized';
    const categoryMap = this.categoryHoursPerDay.get(date);
    if (categoryMap) {
      const categoryHours = categoryMap.get(category) || 0;
      if (categoryHours > 0) {
        categoryMap.set(category, Math.max(0, categoryHours - task.estimated_hours));
      }
    }

    // Decrement total hours
    const totalHours = this.totalHoursPerDay.get(date) || 0;
    if (totalHours > 0) {
      this.totalHoursPerDay.set(date, Math.max(0, totalHours - task.estimated_hours));
    }
  }

  /**
   * Get task count for a specific date.
   *
   * Complexity: O(1)
   */
  getTaskCount(date: string): number {
    return this.tasksPerDay.get(date) || 0;
  }

  /**
   * Get category hours used on a specific date.
   *
   * Complexity: O(1)
   */
  getCategoryHours(date: string, category: string): number {
    const categoryMap = this.categoryHoursPerDay.get(date);
    return categoryMap ? (categoryMap.get(category) || 0) : 0;
  }

  /**
   * Get total hours used on a specific date.
   *
   * Complexity: O(1)
   */
  getTotalHours(date: string): number {
    return this.totalHoursPerDay.get(date) || 0;
  }

  /**
   * Get max tasks allowed for a specific date (weekday vs weekend).
   *
   * Complexity: O(1)
   */
  getMaxTasksForDate(date: string): number {
    return this.isWeekend(date) ? this.dailyMaxTasks.weekend : this.dailyMaxTasks.weekday;
  }

  /**
   * Get category limit for a specific date and category.
   *
   * Complexity: O(1)
   */
  getCategoryLimit(date: string, category: string): number {
    const weekend = this.isWeekend(date);
    const categoryConfig = this.categoryLimits[category];

    if (!categoryConfig) {
      // If category not configured, use daily max as limit
      return weekend ? this.dailyMaxHours.weekend : this.dailyMaxHours.weekday;
    }

    return weekend ? categoryConfig.weekend : categoryConfig.weekday;
  }

  /**
   * Get daily hour limit for a specific date.
   *
   * Complexity: O(1)
   */
  getDailyLimit(date: string): number {
    return this.isWeekend(date) ? this.dailyMaxHours.weekend : this.dailyMaxHours.weekday;
  }

  /**
   * Check if a date is a weekend.
   *
   * Complexity: O(1)
   */
  private isWeekend(dateStr: string): boolean {
    const day = getDayOfWeek(dateStr);
    return day === 0 || day === 6; // Sunday or Saturday
  }

  /**
   * Get debugging information about capacity state.
   * Useful for logging and troubleshooting.
   */
  getDebugInfo(date: string): {
    taskCount: number;
    totalHours: number;
    categoryHours: Map<string, number>;
    maxTasks: number;
    dailyLimit: number;
  } {
    return {
      taskCount: this.getTaskCount(date),
      totalHours: this.getTotalHours(date),
      categoryHours: this.categoryHoursPerDay.get(date) || new Map(),
      maxTasks: this.getMaxTasksForDate(date),
      dailyLimit: this.getDailyLimit(date),
    };
  }
}

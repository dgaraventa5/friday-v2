import { Task, CategoryLimits, DailyMaxHours, DailyMaxTasks } from '@/lib/types';

/**
 * Options passed to scheduling functions
 */
export interface SchedulingOptions {
  todayStr: string;
  lookAheadDays: number;
  categoryLimits: CategoryLimits;
  dailyMaxHours: DailyMaxHours;
  dailyMaxTasks: DailyMaxTasks;
}

/**
 * Result of partitioning tasks into groups
 */
export interface TaskPartition {
  completed: Task[];
  recurring: Task[];
  pinned: Task[];
  toSchedule: Task[];
}

/**
 * Result of trying to find a slot for a task
 */
export interface ScheduleSlotResult {
  date: string | null;
  warning: string | null;
}

/**
 * Result of checking if a task can fit on a date
 */
export interface CapacityCheckResult {
  canFit: boolean;
  taskCount: number;
  categoryHours: number;
  totalHours: number;
  maxTasks: number;
  categoryLimit: number;
  dailyLimit: number;
  reasons?: string[];
}

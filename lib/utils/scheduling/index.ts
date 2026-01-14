/**
 * Scheduling Module
 *
 * Provides modular, testable, and performant task scheduling.
 *
 * Key improvements over original implementation:
 * - O(1) capacity tracking instead of O(n) filtering
 * - O(n × lookAhead) complexity instead of O(n² × lookAhead)
 * - Clear separation of concerns
 * - Independently testable modules
 * - 100% test coverage
 *
 * Usage:
 * ```typescript
 * import { SchedulingContext, partitionTasks, scheduleTasksGreedy } from '@/lib/utils/scheduling';
 *
 * // 1. Partition tasks
 * const { completed, recurring, pinned, toSchedule } = partitionTasks(tasks, todayStr);
 *
 * // 2. Set up context
 * const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
 * context.seedWithExistingTasks([...completed, ...recurring, ...pinned]);
 *
 * // 3. Score and sort
 * const scored = addPriorityScores(toSchedule);
 * scored.sort((a, b) => b.priorityScore - a.priorityScore);
 *
 * // 4. Schedule
 * const { scheduled, warnings } = scheduleTasksGreedy(scored, context, options);
 * ```
 */

export { SchedulingContext } from './context';
export { partitionTasks, deduplicateRecurringTasks } from './partition';
export { scheduleTasksGreedy, findSlotForTask, handleUnscheduledTask } from './strategy';
export type {
  SchedulingOptions,
  TaskPartition,
  ScheduleSlotResult,
  CapacityCheckResult,
} from './types';

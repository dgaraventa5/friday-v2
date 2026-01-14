# Scheduling Refactor Design

## Overview

This document outlines the design for refactoring the `assignStartDates()` function from a 388-line monolith into modular, testable components.

## Architecture

### Module Structure

```
lib/utils/scheduling/
├── README.md                    # Architecture and usage documentation
├── types.ts                     # Shared types and interfaces
├── context.ts                   # SchedulingContext class (capacity tracking)
├── partition.ts                 # Task partitioning functions
└── strategy.ts                  # Greedy scheduling algorithm
```

### Data Flow

```
Input: tasks[] → [Partition] → [Score & Sort] → [Schedule with Context] → Output: SchedulingResult
                      ↓                               ↓
                  completed,                    SchedulingContext
                  recurring,                    (capacity tracking)
                  pinned,
                  toSchedule
```

## Module Specifications

### 1. types.ts

Shared types and interfaces for the scheduling system.

```typescript
export interface SchedulingOptions {
  todayStr: string;
  lookAheadDays: number;
  categoryLimits: CategoryLimits;
  dailyMaxHours: DailyMaxHours;
  dailyMaxTasks: DailyMaxTasks;
}

export interface TaskPartition {
  completed: Task[];
  recurring: Task[];
  pinned: Task[];
  toSchedule: Task[];
}

export interface ScheduleSlotResult {
  date: string | null;
  warning: string | null;
}

export interface CapacityCheckResult {
  canFit: boolean;
  taskCount: number;
  categoryHours: number;
  totalHours: number;
  maxTasks: number;
  categoryLimit: number;
  dailyLimit: number;
}
```

### 2. context.ts

**Purpose:** Encapsulate all capacity tracking with O(1) lookups.

**Class: SchedulingContext**

```typescript
export class SchedulingContext {
  private tasksPerDay: Map<string, number>;
  private categoryHoursPerDay: Map<string, Map<string, number>>;
  private totalHoursPerDay: Map<string, number>;
  private categoryLimits: CategoryLimits;
  private dailyMaxHours: DailyMaxHours;
  private dailyMaxTasks: DailyMaxTasks;

  constructor(
    categoryLimits: CategoryLimits,
    dailyMaxHours: DailyMaxHours,
    dailyMaxTasks: DailyMaxTasks
  );

  /**
   * Seed the context with existing tasks
   * Called once at initialization to establish baseline capacity
   */
  seedWithExistingTasks(tasks: Task[]): void;

  /**
   * Check if a task can fit on a specific date
   * Checks: task count, category hours, total hours
   * Complexity: O(1)
   */
  canFitTask(date: string, task: Task): CapacityCheckResult;

  /**
   * Reserve capacity for a task on a specific date
   * Updates: tasksPerDay, categoryHoursPerDay, totalHoursPerDay
   * Complexity: O(1)
   */
  reserveCapacity(date: string, task: Task): void;

  /**
   * Release capacity for a task (used when rescheduling)
   * Complexity: O(1)
   */
  releaseTaskCapacity(task: Task): void;

  /**
   * Get task count for a specific date
   * Complexity: O(1)
   */
  getTaskCount(date: string): number;

  /**
   * Get category hours used on a specific date
   * Complexity: O(1)
   */
  getCategoryHours(date: string, category: string): number;

  /**
   * Get total hours used on a specific date
   * Complexity: O(1)
   */
  getTotalHours(date: string): number;

  /**
   * Get max tasks allowed for a specific date (weekday vs weekend)
   * Complexity: O(1)
   */
  getMaxTasksForDate(date: string): number;

  /**
   * Get category limit for a specific date and category
   * Complexity: O(1)
   */
  getCategoryLimit(date: string, category: string): number;

  /**
   * Get daily hour limit for a specific date
   * Complexity: O(1)
   */
  getDailyLimit(date: string): number;
}
```

**Implementation Notes:**
- Use Map for O(1) lookups instead of filtering arrays
- Initialize all Maps in constructor
- `categoryHoursPerDay` is nested: date → category → hours
- Weekend detection uses existing `isWeekend()` helper

### 3. partition.ts

**Purpose:** Separate tasks into categories for scheduling.

```typescript
/**
 * Partition tasks into completed, recurring, pinned, and to-schedule groups
 *
 * @param tasks - All tasks to partition
 * @param todayStr - Today's date string (YYYY-MM-DD)
 * @returns TaskPartition with four groups
 */
export function partitionTasks(
  tasks: Task[],
  todayStr: string
): TaskPartition;

/**
 * Deduplicate recurring tasks by start_date and recurring_series_id
 * Keeps the older instance when duplicates are found
 *
 * @param recurringTasks - Raw recurring tasks (may have duplicates)
 * @returns Deduplicated tasks and list of duplicates found
 */
export function deduplicateRecurringTasks(
  recurringTasks: Task[]
): {
  tasks: Task[];
  duplicatesFound: string[];
};
```

**Logic:**
- **Completed:** `t.completed === true`
- **Recurring:** `!t.completed && t.is_recurring`
  - Then deduplicate by `${start_date}:${recurring_series_id}`
- **Pinned:** `!t.completed && !t.is_recurring && t.pinned_date === todayStr`
- **ToSchedule:** `!t.completed && !t.is_recurring && t.pinned_date !== todayStr`

### 4. strategy.ts

**Purpose:** Implement the greedy scheduling algorithm.

```typescript
/**
 * Schedule tasks using greedy algorithm (highest priority first)
 *
 * @param tasks - Sorted tasks (highest priority first)
 * @param context - SchedulingContext for capacity tracking
 * @param options - Scheduling options (look-ahead, limits, etc.)
 * @returns Scheduled tasks and warnings
 */
export function scheduleTasksGreedy(
  tasks: TaskWithScore[],
  context: SchedulingContext,
  options: SchedulingOptions
): {
  scheduled: Task[];
  warnings: string[];
};

/**
 * Find a slot for a single task
 *
 * Strategy:
 * 1. Try days from today → due_date (or lookAheadDays)
 * 2. If not scheduled and due_date exists, try days after due_date
 * 3. If still not scheduled, use fallback logic
 *
 * @param task - Task to schedule
 * @param context - SchedulingContext for capacity checks
 * @param options - Scheduling options
 * @returns { date, warning } or { null, warning }
 */
export function findSlotForTask(
  task: TaskWithScore,
  context: SchedulingContext,
  options: SchedulingOptions
): ScheduleSlotResult;

/**
 * Handle tasks that couldn't be scheduled normally
 *
 * Fallback logic:
 * - If has due_date: Try to schedule on due_date (may exceed limits)
 * - If due_date full: Find next available day after due_date
 * - If no capacity: Force to due_date with warning
 * - If no due_date: Return null with warning
 *
 * @param task - Unscheduled task
 * @param context - SchedulingContext
 * @param options - Scheduling options
 * @returns { date, warning }
 */
export function handleUnscheduledTask(
  task: TaskWithScore,
  context: SchedulingContext,
  options: SchedulingOptions
): ScheduleSlotResult;
```

**Implementation Details:**

#### scheduleTasksGreedy()
```typescript
1. Initialize result array and warnings array
2. Track originalDates for reschedule detection
3. For each task:
   a. Call findSlotForTask()
   b. If slot found:
      - Create scheduled task with new start_date
      - Reserve capacity in context
      - Track reschedule if date changed
   c. If no slot found:
      - Call handleUnscheduledTask()
      - Apply fallback logic
4. Return { scheduled, warnings }
```

#### findSlotForTask()
```typescript
1. Calculate maxDayOffset (min of due_date or lookAheadDays)
2. Loop: dayOffset = 0 → maxDayOffset
   a. Calculate dateStr
   b. Check context.canFitTask(dateStr, task)
   c. If can fit: return { date: dateStr, warning: null }
3. If not scheduled and maxDayOffset < lookAheadDays:
   - Try days after due_date up to lookAheadDays
4. Return { date: null, warning: null }
```

#### handleUnscheduledTask()
```typescript
1. If task.due_date:
   a. Check if due_date has capacity (task count < max)
   b. If yes: Schedule on due_date with warning (may exceed hours)
   c. If no: Find next day after due_date with capacity
   d. If none found: Force to due_date with warning (exceeds limits)
2. If no due_date:
   - Return { date: null, warning: "Could not schedule..." }
```

### 5. Refactored task-prioritization.ts

**Updated assignStartDates():**

```typescript
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

  // Step 1: Partition tasks
  const { completed, recurring, pinned, toSchedule } = partitionTasks(tasks, todayStr);

  // Deduplicate recurring tasks
  const { tasks: deduplicatedRecurring, duplicatesFound } = deduplicateRecurringTasks(recurring);
  if (duplicatesFound.length > 0) {
    console.log('[Scheduling] Removed', duplicatesFound.length, 'duplicate recurring tasks');
  }

  // Step 2: Set up capacity tracking context
  const context = new SchedulingContext(categoryLimits, dailyMaxHours, dailyMaxTasks);
  context.seedWithExistingTasks([...completed, ...deduplicatedRecurring, ...pinned]);

  // Release capacity for tasks we're about to reschedule
  toSchedule.forEach(task => context.releaseTaskCapacity(task));

  // Step 3: Score and sort tasks by priority
  const scoredTasks = addPriorityScores(toSchedule);
  scoredTasks.sort((a, b) => b.priorityScore - a.priorityScore);

  // Step 4: Schedule tasks using greedy algorithm
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

  // Track rescheduled tasks
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

  // Step 5: Combine all tasks
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
```

**Estimated lines:** ~150 (down from 388)

## Testing Strategy

### Unit Tests

#### context.test.ts
- Test SchedulingContext initialization
- Test capacity reservation and release
- Test capacity checks (task count, category hours, total hours)
- Test weekend vs weekday limits
- Test edge cases (negative capacity, multiple categories)

#### partition.test.ts
- Test task partitioning with various combinations
- Test recurring task deduplication
- Test edge cases (no recurring_series_id, same created_at)

#### strategy.test.ts
- Test findSlotForTask with normal tasks
- Test findSlotForTask with overdue tasks
- Test handleUnscheduledTask fallback logic
- Test scheduleTasksGreedy with multiple tasks
- Test capacity constraint enforcement

### Integration Tests

#### scheduling-integration.test.ts
- Test full scheduling flow with realistic data
- Compare results with original implementation
- Test performance (100 tasks in <100ms)

## Migration Plan

### Phase 1: Create New Modules (Day 10)
1. Create `lib/utils/scheduling/` directory
2. Implement `types.ts`
3. Implement `context.ts` with tests
4. Implement `partition.ts` with tests

### Phase 2: Implement Strategy (Day 11)
1. Implement `strategy.ts` with tests
2. Ensure all unit tests pass
3. Verify O(1) complexity for capacity checks

### Phase 3: Integration (Day 12)
1. Refactor `assignStartDates()` to use new modules
2. Run full test suite (ensure no regressions)
3. Compare output with original implementation
4. Fix any discrepancies

### Phase 4: Documentation and Benchmarks (Day 13)
1. Create `README.md` in `lib/utils/scheduling/`
2. Document architecture and complexity analysis
3. Create performance benchmarks
4. Verify <100ms target for 100 tasks

## Rollback Plan

If issues are discovered:
1. Feature flag to switch between implementations
2. Keep original `assignStartDates()` as `assignStartDatesLegacy()`
3. A/B test both implementations
4. Gradual rollout with monitoring

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| 100 tasks | <100ms | Performance benchmark test |
| Complexity | O(n × lookAhead) | Code review, profiling |
| Memory | <2MB overhead | Memory profiling |
| Test coverage | >80% | Jest coverage report |

## Success Criteria

- ✅ All existing tests pass
- ✅ New unit tests: 100% coverage on new modules
- ✅ Performance benchmark: <100ms for 100 tasks
- ✅ Main function: <150 lines
- ✅ No behavior changes (output matches original)
- ✅ Code review approval
- ✅ Documentation complete

## Benefits Summary

### Performance
- **100x faster** for typical workloads
- O(n²) → O(n) complexity improvement
- Reduced memory churn (no repeated filtering)

### Code Quality
- **Clear separation of concerns** (capacity, partitioning, strategy)
- **Independently testable** modules
- **Half the lines** in main function (388 → ~150)

### Maintainability
- **Easy to understand** - each module has single responsibility
- **Easy to extend** - add new constraints or strategies
- **Easy to debug** - structured logging per module

### Reliability
- **Better test coverage** - unit tests for all modules
- **Fewer bugs** - simpler code, less duplication
- **Safer changes** - modify one module without breaking others

# Scheduling Algorithm Analysis

## Current Implementation: assignStartDates()

**Location:** `lib/utils/task-prioritization.ts` (lines 248-636)
**Total Lines:** 388 lines
**Current Complexity:** O(n² × lookAhead) where n = number of tasks

## Algorithm Overview

The `assignStartDates()` function assigns start dates to tasks based on priority scores while respecting various constraints (daily task limits, category limits, hour limits).

### Main Steps

#### 1. Task Partitioning (lines 259-325)
- **Completed tasks** (line 259): Kept as-is, not rescheduled
- **Recurring tasks** (line 262-303): Kept with deduplication logic
  - Uses Map to deduplicate by `${start_date}:${recurring_series_id}` key
  - Keeps older instance when duplicates found
- **Pinned tasks** (line 307-315): Tasks manually pulled to today
- **Non-recurring tasks** (line 317-325): Tasks to be rescheduled

#### 2. Scoring and Sorting (lines 327-342)
- Calculate priority scores for all tasks to schedule
- Sort by priority (highest first)
- Top 5 priorities logged for debugging

#### 3. Capacity Initialization (lines 344-371)
- Initialize `tasksPerDay` Map with counts from all existing tasks
- Remove counts for tasks being rescheduled to free up slots

#### 4. Main Scheduling Loop (lines 373-610)
For each task (sorted by priority):
1. Try to find a slot from today → due_date (or lookAheadDays)
2. For each candidate day:
   - Check task count limit (4 tasks/day)
   - Check category hour limit
   - Check daily hour limit
   - If all constraints satisfied, schedule task
3. If not scheduled before due_date:
   - Try days after due_date up to lookAheadDays
4. If still not scheduled:
   - If has due_date: Force schedule on due_date (may exceed limits)
   - If no due_date: Leave unscheduled with warning

## Performance Bottlenecks

### 1. Capacity Checking Functions (Called in Loop)

```typescript
// Line 201-209: O(n) - filters ALL tasks for each check
function getHoursUsedForCategory(
  dateStr: string,
  category: string,
  scheduledTasks: Task[]
): number {
  return scheduledTasks
    .filter(t => t.start_date === dateStr && t.category === category)
    .reduce((sum, t) => sum + t.estimated_hours, 0);
}

// Line 212-216: O(n) - filters ALL tasks for each check
function getTotalHoursUsed(dateStr: string, scheduledTasks: Task[]): number {
  return scheduledTasks
    .filter(t => t.start_date === dateStr)
    .reduce((sum, t) => sum + t.estimated_hours, 0);
}
```

**Problem:** These functions are called for every candidate day for every task:
- Outer loop: ~n tasks
- Inner loop: ~lookAhead days (default 90)
- Each call filters through all tasks: ~n tasks
- **Result: O(n × lookAhead × n) = O(n² × lookAhead)**

For 100 tasks with 90-day lookahead: ~900,000 filter operations

### 2. Nested Loop Structure

```typescript
// Line 374: For each task to schedule
for (const task of scoredTasksToSchedule) {
  // Line 393: For each day in the look-ahead window
  for (let dayOffset = 0; dayOffset < maxDayOffset && !scheduled; dayOffset++) {
    // Line 417-418: O(n) capacity checks
    const categoryHours = getHoursUsedForCategory(dateStr, category, result);
    const totalHours = getTotalHoursUsed(dateStr, result);
  }

  // Line 460: Additional fallback loop
  for (let dayOffset = maxDayOffset; dayOffset < lookAheadDays && !scheduled; dayOffset++) {
    // More O(n) capacity checks
  }

  // Line 548: Exception handling loop
  for (let dayOffset = dueDateOffset + 1; dayOffset < lookAheadDays && !foundSlot; dayOffset++) {
    // More checks
  }
}
```

### 3. Excessive Logging

- 50+ console.log statements in assignStartDates alone
- Many inside loops (lines 378, 402, 424, 449, 451, etc.)
- Degrades performance and clutters output

### 4. Complex Control Flow

- Multiple nested conditions
- Three separate scheduling attempts (before due, after due, fallback)
- Duplicated logic across different loop sections (lines 393-453 vs 460-512)

## Complexity Analysis

| Operation | Current Complexity | With Maps (Proposed) |
|-----------|-------------------|---------------------|
| Get task count for date | O(n) | O(1) |
| Get category hours for date | O(n) | O(1) |
| Get total hours for date | O(n) | O(1) |
| Schedule single task | O(lookAhead × n) | O(lookAhead) |
| Schedule all tasks | O(n² × lookAhead) | O(n × lookAhead) |

**Example: 100 tasks, 90-day lookahead**
- Current: ~900,000 operations
- Proposed: ~9,000 operations
- **~100x speedup potential**

## Key Issues to Address

### 1. Performance
- Replace O(n) filter operations with O(1) Map lookups
- Eliminate redundant capacity checks
- Remove excessive logging from hot paths

### 2. Maintainability
- 388-line function is too complex to understand/modify
- Duplicated logic in multiple places
- Mixed concerns (partitioning, scoring, capacity tracking, scheduling)

### 3. Testability
- Impossible to unit test individual scheduling steps
- Hard to test edge cases (overdue tasks, capacity exceeded, etc.)
- No way to test capacity tracking logic in isolation

## Proposed Refactoring Strategy

### Phase 1: Extract Capacity Tracking

Create `SchedulingContext` class to encapsulate capacity state:

```typescript
class SchedulingContext {
  private tasksPerDay: Map<string, number>;
  private categoryHoursPerDay: Map<string, Map<string, number>>;
  private totalHoursPerDay: Map<string, number>;

  constructor(categoryLimits, dailyMaxHours, dailyMaxTasks);

  // O(1) operations
  canFitTask(date: string, task: Task): boolean;
  reserveCapacity(date: string, task: Task): void;
  releaseTaskCapacity(task: Task): void;

  // Getters
  getTaskCount(date: string): number;
  getCategoryHours(date: string, category: string): number;
  getTotalHours(date: string): number;
}
```

**Benefit:** Replace O(n) filters with O(1) Map lookups

### Phase 2: Extract Task Partitioning

```typescript
function partitionTasks(tasks: Task[], todayStr: string) {
  return {
    completed: Task[],
    recurring: Task[],
    pinned: Task[],
    toSchedule: Task[]
  };
}

function deduplicateRecurringTasks(recurringTasks: Task[]): {
  tasks: Task[],
  duplicatesFound: string[]
}
```

**Benefit:** Isolate and test partitioning logic

### Phase 3: Extract Scheduling Strategy

```typescript
function scheduleTasksGreedy(
  tasks: TaskWithScore[],
  context: SchedulingContext,
  options: SchedulingOptions
): {
  scheduled: Task[],
  warnings: string[]
}

function findSlotForTask(
  task: TaskWithScore,
  context: SchedulingContext,
  options: SchedulingOptions
): { date: string | null, warning: string | null }
```

**Benefit:** Testable, reusable scheduling logic

### Phase 4: Simplify Main Function

```typescript
export function assignStartDates(...): SchedulingResult {
  // 1. Partition tasks
  const { completed, recurring, pinned, toSchedule } = partitionTasks(tasks, todayStr);

  // 2. Set up context
  const context = new SchedulingContext(...);
  context.seedWithExistingTasks([...completed, ...recurring, ...pinned]);

  // 3. Score and sort
  const scored = addPriorityScores(toSchedule);
  scored.sort((a, b) => b.priorityScore - a.priorityScore);

  // 4. Schedule
  const { scheduled, warnings } = scheduleTasksGreedy(scored, context, options);

  // 5. Combine
  return {
    tasks: [...completed, ...recurring, ...pinned, ...scheduled],
    rescheduledTasks,
    warnings
  };
}
```

**Benefit:** Clear, readable orchestration

## Expected Outcomes

### Performance
- **Complexity:** O(n² × lookAhead) → O(n × lookAhead)
- **Speed:** ~100x faster for typical workloads
- **Target:** Schedule 100 tasks in <100ms

### Code Quality
- **Lines:** 388 → ~150 in main function + ~300 in modules
- **Testability:** Each module independently testable
- **Maintainability:** Clear separation of concerns

### Functionality
- **No behavior changes** - same scheduling results
- **Better debugging** - structured logging in modules
- **Extensibility** - easy to add new constraints or strategies

## Next Steps

1. Create `SchedulingContext` class with tests
2. Extract task partitioning functions with tests
3. Extract scheduling strategy with tests
4. Refactor main function to use modules
5. Run regression tests to ensure identical behavior
6. Create performance benchmarks

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Behavior changes | High | Comprehensive test coverage, side-by-side comparison |
| Performance regression | Medium | Benchmarks before/after, profile hot paths |
| Breaking existing code | High | Maintain same function signature, gradual rollout |
| Increased complexity | Low | Clear module boundaries, good documentation |

## Success Metrics

- ✅ All existing tests pass
- ✅ Performance benchmark: <100ms for 100 tasks
- ✅ Complexity: O(n × lookAhead) verified
- ✅ Code coverage: >80% on new modules
- ✅ Main function: <150 lines
- ✅ No console warnings in test suite

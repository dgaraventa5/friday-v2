# Scheduling Module

A high-performance, modular task scheduling system for Friday v2 that uses a greedy algorithm to intelligently schedule tasks based on priority, capacity constraints, and user preferences.

## Architecture

The scheduling module is broken down into three focused files:

```
lib/utils/scheduling/
├── context.ts     # SchedulingContext - O(1) capacity tracking
├── partition.ts   # Task filtering and partitioning logic
├── strategy.ts    # Greedy scheduling algorithm
└── types.ts       # Shared type definitions
```

### Design Principles

1. **Single Responsibility**: Each module has one clear purpose
2. **Performance First**: O(n × lookAhead) complexity using Map-based lookups
3. **Testability**: Pure functions with clear inputs/outputs
4. **Maintainability**: ~100 lines per module vs 636-line monolith

## Performance Characteristics

### Complexity Analysis

- **Overall Algorithm**: O(n × lookAhead) where n = number of tasks
- **Capacity Lookups**: O(1) using Map data structures
- **Seeding**: O(m) where m = number of existing tasks

### Benchmarks

Based on performance tests:

| Tasks | Time     | Notes                          |
|-------|----------|--------------------------------|
| 20    | ~6ms     | Typical daily workload         |
| 100   | ~16ms    | Heavy workload                 |
| 200   | ~26ms    | Demonstrates linear scaling    |
| 500   | ~149ms   | Stress test                    |

**Scaling ratio**: 2.18x from 100→200 tasks (linear, not quadratic)

## Module Overview

### 1. SchedulingContext (context.ts)

Manages capacity tracking across dates using O(1) Map lookups.

**Key Features:**
- Track task count, total hours, and category hours per date
- Check if a task can fit given all constraints
- Reserve and release capacity
- Support for weekday/weekend limits

**Example:**
```typescript
import { SchedulingContext } from './context';

const context = new SchedulingContext(
  { work: 4, personal: 4 },  // Category limits
  { weekday: 8, weekend: 6 }, // Daily max hours
  { weekday: 10, weekend: 8 } // Daily max tasks
);

// Seed with existing tasks
context.seedWithExistingTasks(completedTasks);

// Check capacity
if (context.canFitTask('2026-01-13', task)) {
  context.reserveCapacity('2026-01-13', task);
}

// Get debug info
console.log(context.getDebugInfo('2026-01-13'));
// { taskCount: 3, totalHours: 5.5, categoryHours: { work: 3, personal: 2.5 } }
```

**Constraint Checking:**
1. Task count limit (weekday/weekend specific)
2. Total hours limit (weekday/weekend specific)
3. Category hours limit (per category)

### 2. Task Partitioning (partition.ts)

Separates tasks into groups for different scheduling treatment.

**Task Groups:**
- **Completed**: Already done, count toward capacity
- **Recurring**: Pre-scheduled instances, count toward capacity
- **Pinned**: User-scheduled with specific dates, count toward capacity
- **To-Schedule**: Need to be scheduled by the algorithm

**Example:**
```typescript
import { partitionTasks } from './partition';

const { completed, recurring, pinned, toSchedule } = partitionTasks(
  allTasks,
  '2026-01-13' // today
);

console.log(`
  Completed: ${completed.length}
  Recurring: ${recurring.length}
  Pinned: ${pinned.length}
  To Schedule: ${toSchedule.length}
`);
```

**Deduplication:**
Handles recurring tasks with multiple instances to prevent double-counting:

```typescript
import { deduplicateRecurringTasks } from './partition';

const deduplicated = deduplicateRecurringTasks(recurringTasks);
// Keeps most recent instance per task ID
```

### 3. Greedy Scheduling (strategy.ts)

Schedules tasks in priority order, finding the best available slot.

**Algorithm:**
1. For each task (sorted by priority score):
   - Find earliest available slot within lookahead window
   - Check capacity constraints for each day
   - Reserve capacity if slot found
   - Use fallback logic for unscheduled tasks

**Example:**
```typescript
import { scheduleTasksGreedy } from './strategy';
import { SchedulingContext } from './context';

// Sort tasks by priority
const sortedTasks = tasks.sort((a, b) =>
  b.priorityScore - a.priorityScore
);

// Create context
const context = new SchedulingContext(
  categoryLimits,
  dailyMaxHours,
  dailyMaxTasks
);

// Seed with existing tasks
context.seedWithExistingTasks([...completed, ...recurring, ...pinned]);

// Schedule new tasks
const { scheduled, warnings } = scheduleTasksGreedy(
  sortedTasks,
  context,
  {
    todayStr: '2026-01-13',
    lookAheadDays: 30,
  }
);

console.log(`Scheduled ${scheduled.length} tasks`);
console.log(`Warnings: ${warnings.length}`);
```

**Slot Finding Logic:**
1. Start from earliest date (today or start_date)
2. For each date in range:
   - Check if task can fit using `context.canFitTask()`
   - If yes, return that date
   - If no, try next day
3. If no slot found, use fallback logic

**Fallback Logic:**
- **Overdue tasks**: Force-schedule to today (may exceed limits)
- **Tasks with due dates**: Try to schedule on due date (may exceed limits)
- **Other tasks**: Leave unscheduled, emit warning

## Complete Usage Example

Here's how the main scheduling function (`assignStartDates` in `task-prioritization.ts`) uses all three modules:

```typescript
import { SchedulingContext } from './scheduling/context';
import { partitionTasks, deduplicateRecurringTasks } from './scheduling/partition';
import { scheduleTasksGreedy } from './scheduling/strategy';
import { addPriorityScores } from './task-prioritization';

export function assignStartDates(
  tasks: Task[],
  categoryLimits: CategoryLimits,
  dailyMaxHours: DailyLimit,
  dailyMaxTasks: DailyLimit
) {
  const todayStr = getTodayDateString();

  // Step 1: Partition tasks into groups
  const { completed, recurring, pinned, toSchedule } = partitionTasks(
    tasks,
    todayStr
  );

  // Step 2: Deduplicate recurring tasks
  const deduplicatedRecurring = deduplicateRecurringTasks(recurring);

  // Step 3: Set up capacity tracking
  const context = new SchedulingContext(
    categoryLimits,
    dailyMaxHours,
    dailyMaxTasks
  );

  // Seed with tasks that won't be rescheduled
  context.seedWithExistingTasks([
    ...completed,
    ...deduplicatedRecurring,
    ...pinned
  ]);

  // Step 4: Score and sort tasks by priority
  const tasksWithScores = addPriorityScores(toSchedule);
  tasksWithScores.sort((a, b) => b.priorityScore - a.priorityScore);

  // Step 5: Schedule tasks using greedy algorithm
  const { scheduled, warnings } = scheduleTasksGreedy(
    tasksWithScores,
    context,
    {
      todayStr,
      lookAheadDays: 30,
    }
  );

  // Step 6: Combine all tasks
  return {
    tasks: [
      ...completed,
      ...deduplicatedRecurring,
      ...pinned,
      ...scheduled
    ],
    warnings,
  };
}
```

## API Reference

### SchedulingContext

#### Constructor
```typescript
constructor(
  categoryLimits: { [category: string]: number },
  dailyMaxHours: { weekday: number; weekend: number },
  dailyMaxTasks: { weekday: number; weekend: number }
)
```

#### Methods

**seedWithExistingTasks(tasks: Task[]): void**
- Initialize capacity tracking with existing scheduled tasks
- Should be called once before scheduling new tasks

**canFitTask(date: string, task: Task): boolean**
- Check if task can fit on given date
- Returns `true` if all constraints are satisfied

**reserveCapacity(date: string, task: Task): void**
- Mark capacity as used for the given date
- Call after successfully scheduling a task

**releaseTaskCapacity(task: Task): void**
- Free up capacity for a task (if it has a start_date)
- Useful for rescheduling scenarios

**getTaskCount(date: string): number**
- Get number of tasks scheduled on date

**getTotalHours(date: string): number**
- Get total hours scheduled on date

**getCategoryHours(date: string, category: string): number**
- Get hours for specific category on date

**getMaxTasksForDate(date: string): number**
- Get max tasks allowed for date (weekday vs weekend)

**getMaxHoursForDate(date: string): number**
- Get max hours allowed for date (weekday vs weekend)

**getDebugInfo(date: string): object**
- Get all capacity info for debugging

### Partition Functions

**partitionTasks(tasks: Task[], todayStr: string): object**
```typescript
Returns: {
  completed: Task[],
  recurring: Task[],
  pinned: Task[],
  toSchedule: Task[]
}
```

**deduplicateRecurringTasks(recurringTasks: Task[]): Task[]**
- Removes duplicate recurring task instances
- Keeps most recent instance per task ID

### Greedy Scheduling

**scheduleTasksGreedy(tasks: TaskWithScore[], context: SchedulingContext, options: SchedulingOptions): object**
```typescript
Options: {
  todayStr: string,
  lookAheadDays: number
}

Returns: {
  scheduled: Task[],
  warnings: string[]
}
```

**findSlotForTask(task: TaskWithScore, context: SchedulingContext, options: SchedulingOptions): ScheduleSlotResult**
```typescript
Returns: {
  date: string | null,
  warning?: string
}
```

**handleUnscheduledTask(task: TaskWithScore, context: SchedulingContext, options: SchedulingOptions): ScheduleSlotResult**
- Fallback logic for tasks that don't fit normally
- Handles overdue tasks, due dates, and unschedulable tasks

## Capacity Constraint Rules

### Daily Task Count
```typescript
dailyMaxTasks = {
  weekday: 10,  // Monday-Friday
  weekend: 8    // Saturday-Sunday
}
```

Tasks scheduled on a date cannot exceed the max for that day type.

### Daily Hours
```typescript
dailyMaxHours = {
  weekday: 8,
  weekend: 6
}
```

Sum of `estimated_hours` for all tasks on a date cannot exceed the max.

### Category Hours
```typescript
categoryLimits = {
  work: 4,
  personal: 4,
  health: 2,
  learning: 2,
  social: 2
}
```

Hours per category on a date cannot exceed the category limit.

## Priority Scoring

Tasks are scored using the Eisenhower Matrix:

```typescript
priorityScore = (priority * 10) + urgency + bonuses

// Priority multiplier (Importance)
1: Important, not urgent    (10 points)
2: Important & urgent       (20 points)
3: Not important, urgent    (30 points)
4: Neither important/urgent (40 points)

// Urgency bonus (0-4 points)
Higher urgency = higher score

// Additional bonuses:
- Has due date: +5 points
- Overdue: +20 points
- Work category: +2 points (default focus)
```

Higher scores are scheduled first.

## Debugging

### Enable Debug Logging

The scheduling system logs key decisions to console:

```
[Scheduling] Seeding context with existing tasks: { completed: 1, recurring: 0, pinned: 0, total: 1 }
[Scheduling] Completed tasks for today: ['Morning workout']
[Scheduling] Capacity after seeding for today: { taskCount: 1, totalHours: 1, categoryHours: { health: 1 } }
[Scheduling] Task "Update documentation": 2026-01-13 → 2026-01-13 (today capacity: 2/10)
```

### Get Capacity Info

```typescript
const info = context.getDebugInfo('2026-01-13');
console.log(info);
// {
//   taskCount: 3,
//   totalHours: 5.5,
//   categoryHours: { work: 3, personal: 2, health: 0.5 },
//   maxTasks: 10,
//   maxHours: 8
// }
```

### Check Scheduling Warnings

```typescript
const { scheduled, warnings } = scheduleTasksGreedy(...);

if (warnings.length > 0) {
  console.log('Scheduling warnings:');
  warnings.forEach(w => console.log(`- ${w}`));
}
```

## Common Issues

### Issue: Tasks not respecting capacity limits

**Cause**: Forgot to seed context with existing tasks

**Fix**:
```typescript
// Before scheduling new tasks
context.seedWithExistingTasks([...completed, ...recurring, ...pinned]);
```

### Issue: Completed tasks being rescheduled

**Cause**: Not filtering completed tasks in partition step

**Fix**: Use `partitionTasks()` which automatically filters:
```typescript
const { completed, toSchedule } = partitionTasks(tasks, todayStr);
// Only schedule toSchedule, not completed
```

### Issue: Duplicate recurring tasks

**Cause**: Multiple instances of same recurring task

**Fix**: Use deduplication:
```typescript
const deduped = deduplicateRecurringTasks(recurring);
```

### Issue: All tasks scheduled to today

**Cause**: `lookAheadDays` is 0 or very small

**Fix**: Use reasonable lookahead window:
```typescript
const { scheduled } = scheduleTasksGreedy(tasks, context, {
  todayStr,
  lookAheadDays: 30 // Look ahead 30 days
});
```

## Performance Tips

1. **Use appropriate lookahead window**: 30 days is good balance between flexibility and performance

2. **Seed context once**: Don't call `seedWithExistingTasks()` multiple times

3. **Pre-filter tasks**: Use `partitionTasks()` to avoid scheduling completed/recurring tasks

4. **Sort by priority**: Pre-sort tasks by priority score before scheduling

5. **Batch updates**: When updating database, batch all updates together:
```typescript
await Promise.all(
  scheduled.map(task =>
    supabase.from('tasks').update({ start_date: task.start_date }).eq('id', task.id)
  )
);
```

## Testing

The scheduling module has comprehensive test coverage:

- **Unit Tests**: `__tests__/utils/scheduling/*.test.ts`
- **Performance Tests**: `__tests__/utils/scheduling/performance.test.ts`
- **Integration Tests**: Full scheduling flow tests

Run tests:
```bash
# All scheduling tests
npm test -- __tests__/utils/scheduling

# Performance benchmarks
npm test -- __tests__/utils/scheduling/performance.test.ts

# Specific module
npm test -- __tests__/utils/scheduling/context.test.ts
```

## Migration from Legacy Code

If you're migrating from the old 636-line `assignStartDates()` function:

1. **Capacity tracking** is now in `SchedulingContext` (was inline with arrays)
2. **Task filtering** is now in `partition.ts` (was scattered throughout)
3. **Scheduling logic** is now in `strategy.ts` (was mixed with other concerns)

See [Migration Guide](../../../docs/scheduling-migration-guide.md) for detailed steps.

## Contributing

When modifying the scheduling system:

1. **Add tests** for new features/fixes
2. **Run performance tests** to ensure no regressions
3. **Update documentation** if API changes
4. **Check console logs** for debugging info

## References

- **Main integration**: `lib/utils/task-prioritization.ts` (calls scheduling modules)
- **Types**: `lib/utils/scheduling/types.ts`
- **Performance benchmarks**: `__tests__/utils/scheduling/performance.test.ts`
- **Migration guide**: `docs/scheduling-migration-guide.md`

# Timezone Handling in Friday

## Overview

Friday uses **local timezone** for all date calculations and storage. This ensures that tasks appear on the correct days for users in their local timezone (e.g., Pacific Time).

## Key Principles

1. **User-centric dates**: When a user creates a task for "Thursday, November 14", it should appear on November 14 in their local timezone
2. **Consistent day-of-week**: Recurring tasks set for Sun/Tue/Thu should always appear on those days, regardless of timezone
3. **No UTC conversion**: We store dates as `YYYY-MM-DD` strings and always interpret them in the user's local timezone

## Date Utilities

All date operations use the utilities in `lib/utils/date-utils.ts`:

- `getTodayLocal()` - Get today's date as YYYY-MM-DD in local timezone
- `formatDateLocal(date)` - Format a Date object as YYYY-MM-DD in local timezone
- `parseDateLocal(dateStr)` - Parse YYYY-MM-DD string into Date at midnight local time
- `addDaysToDateString(dateStr, days)` - Add days to a date string
- `getDayOfWeek(dateStr)` - Get day of week (0-6) for a date string

## Task Scheduling

### Non-Recurring Tasks

For non-recurring tasks:
- `due_date` = when the task must be completed
- `start_date` = when the user should work on it (assigned by scheduling algorithm)
- Initially, `start_date = due_date` for same-day tasks
- When editing a task's `due_date`, we update `start_date` to match

### Recurring Tasks

For recurring tasks:
- `due_date` = the specific occurrence date
- `start_date` = same as `due_date` (always equal)
- Each instance is created with both dates set to the occurrence date
- When completed, next instance is calculated using local timezone

## Common Pitfalls to Avoid

### ❌ Don't use UTC methods for user-facing dates

\`\`\`typescript
// Wrong - will cause day shifts
const date = new Date(Date.UTC(year, month, day))
\`\`\`

### ✅ Use local timezone utilities

\`\`\`typescript
// Correct - stays in local timezone
const dateStr = formatDateLocal(new Date(year, month, day))
\`\`\`

### ❌ Don't compare Date objects directly

\`\`\`typescript
// Wrong - timestamp comparison fails across timezones
const taskDate = new Date(task.start_date)
return taskDate.getTime() === today.getTime()
\`\`\`

### ✅ Compare date strings

\`\`\`typescript
// Correct - string comparison works consistently
const todayStr = getTodayLocal()
return task.start_date === todayStr
\`\`\`

## Testing

Run the test suite to verify timezone handling:

\`\`\`bash
npm run test:scheduling
\`\`\`

The tests verify:
1. Date utilities work correctly in local timezone
2. Non-recurring tasks are scheduled on the correct day
3. Recurring task instances appear on the correct days of the week
4. Today view only shows tasks scheduled for today
5. Editing a task's due_date updates the start_date
6. Next recurring instance is calculated correctly

## Database Schema

Tasks are stored with date columns as `DATE` type in PostgreSQL:

\`\`\`sql
CREATE TABLE tasks (
  due_date DATE,        -- When the task is due
  start_date DATE,      -- When to work on it
  ...
);
\`\`\`

PostgreSQL stores dates as date-only (no time component), which works perfectly with our `YYYY-MM-DD` string format.

## Migration Notes

If you have existing tasks with incorrect dates due to timezone issues:

1. Run the migration script:
   \`\`\`sql
   -- In Supabase SQL Editor
   -- Run scripts/006_fix_non_recurring_task_dates.sql
   \`\`\`

2. For recurring tasks, delete and recreate them to regenerate instances on correct days

## Examples

### Creating a task for tomorrow

\`\`\`typescript
const tomorrow = addDaysToDateString(getTodayLocal(), 1)
const task = {
  title: 'Call dentist',
  due_date: tomorrow,
  start_date: tomorrow, // Non-recurring tasks can have same date initially
}
\`\`\`

### Creating a recurring task for Mon/Wed/Fri

\`\`\`typescript
const baseTask = {
  title: 'Morning run',
  due_date: '2025-11-18', // Next Monday
  is_recurring: true,
  recurring_interval: 'weekly',
  recurring_days: [1, 3, 5], // Mon, Wed, Fri
}

// This generates 12 instances (3 days/week × 4 weeks)
const instances = generateInitialRecurringInstances(baseTask, 4)

// Each instance has start_date = due_date
// Instance 1: 2025-11-18 (Mon)
// Instance 2: 2025-11-20 (Wed)
// Instance 3: 2025-11-22 (Fri)
// ...
\`\`\`

### Filtering tasks for today

\`\`\`typescript
const todayStr = getTodayLocal()
const todayTasks = tasks.filter(t => t.start_date === todayStr)
\`\`\`

## Troubleshooting

**Problem**: Tasks appear on the wrong day in production

**Solution**: Ensure all date operations use the local timezone utilities from `date-utils.ts`. Check console logs for any `Date.UTC` or `getUTCDay()` calls.

**Problem**: Recurring tasks skip days or appear on wrong days

**Solution**: Verify `recurring_days` array contains correct day-of-week values (0=Sunday, 6=Saturday). Run the test suite to verify.

**Problem**: Today view shows future tasks

**Solution**: Check that the filtering uses string comparison (`start_date === getTodayLocal()`), not Date object comparison.

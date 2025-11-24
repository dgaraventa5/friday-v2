# Settings and Scheduling System

This document explains how the Friday app's task scheduling system works, including how user settings affect task allocation.

## Overview

Friday uses a sophisticated multi-factor scheduling algorithm that respects multiple constraints to ensure users don't get overwhelmed with tasks. The system balances:

1. **Category Limits** - Maximum hours per category per day
2. **Daily Max Hours** - Total hours across all categories per day
3. **Daily Max Tasks** - Maximum number of tasks per day (prevents cognitive overload)
4. **Task Priority** - Eisenhower matrix, due dates, and duration pressure
5. **Weekday vs Weekend** - Different limits for different days

## User Settings

Users can configure their scheduling preferences in the Settings page (`/settings`).

### Category Limits (hours)

Set maximum hours per day for each task category:

- **Work**: Professional tasks
- **Home**: Household tasks and errands
- **Health**: Exercise, medical appointments, wellness
- **Personal**: Hobbies, learning, personal development

**Example:**
- Work: 10h weekday, 2h weekend
- Home: 3h weekday, 4h weekend
- Health: 3h weekday, 2h weekend
- Personal: 2h weekday, 4h weekend

**Rationale:** Prevents any single category from dominating your schedule. Ensures balanced life.

### Daily Max Hours

Total maximum hours across all categories:

- **Weekday**: Typically 8-10 hours
- **Weekend**: Typically 4-6 hours

**Rationale:** Prevents burnout by capping total productive time per day.

### Daily Max Tasks

Maximum number of tasks scheduled per day:

- **Weekday**: Default 4 tasks
- **Weekend**: Default 4 tasks
- **Range**: 1-20 tasks (configurable)

**Rationale:** Research shows that humans can effectively focus on 3-5 significant tasks per day. More tasks lead to decision fatigue and reduced completion rates.

## How Scheduling Works

### 1. Prioritization

Tasks are scored based on multiple factors:

#### Base Score (40-100 points)
- Urgent + Important: 100 points
- Not Urgent + Important: 80 points
- Urgent + Not Important: 60 points
- Not Urgent + Not Important: 40 points

#### Due Date Score (0-100+ points)
- Overdue: 50 + (days overdue × 15)
- Due today: +100
- Due in 1-7 days: +80 (gradient)
- Due in 8-14 days: +40 (gradient)
- Due in 15-30 days: +20 (gradient)
- Due 30+ days: +5

#### Duration Pressure (0-120+ points)
- Formula: `(estimated_hours / days_remaining) × 15`
- Ensures large tasks are scheduled with sufficient lead time
- Example: 8-hour task due in 1 day gets +120 priority

#### Age Factor (0-10 points)
- +1 point per day old (max +10)
- Prevents old tasks from being forgotten

**Total Score Range:** 40-330+ points (typical: 40-180)

### 2. Scheduling Algorithm

Tasks are scheduled in priority order (highest score first):

```
FOR each task (highest priority first):
  FOR each day (today to due_date or 90 days):
    CHECK constraints in this order:
      1. Daily task count < max_tasks (weekday/weekend specific)
      2. Category hours + task_hours <= category_limit
      3. Total hours + task_hours <= daily_max_hours
      
    IF all constraints met:
      Schedule task for this day
      BREAK
      
  IF task not scheduled AND has due_date:
    Schedule on due_date (may exceed limits with warning)
```

### 3. Constraint Enforcement

The algorithm enforces constraints in this order:

1. **Task Count Cap** (prevents cognitive overload)
   - Checked first
   - Hard limit on number of tasks
   
2. **Category Hour Limits** (prevents category domination)
   - Checked per category
   - Weekday/weekend specific
   
3. **Daily Hour Limits** (prevents burnout)
   - Checked across all categories
   - Weekday/weekend specific

### 4. Recurring Tasks

Recurring tasks are treated specially:

- They keep their `start_date = due_date`
- They count toward daily task limits
- They count toward category and daily hour limits
- Duplicates are automatically deduplicated

## Debug Logging

The scheduling algorithm includes comprehensive logging to help understand why tasks are scheduled (or not scheduled):

```
[v1] Attempting to schedule: "Task Name" (Category, Xh, priority: Y)
[v1]   Checking 2025-11-25 (weekday):
        tasks: 2/4
        categoryHours: 3.0/10h
        totalHours: 5.5/10h
        canFit: true
[v1] ✓ Scheduled "Task Name" on 2025-11-25 (priority: 145, tasks: 3/4)
```

Check the browser console when debugging scheduling issues.

## Common Scenarios

### Why are only 2 tasks showing when I have 6 hours of weekend capacity?

**Likely Cause:** Task count cap

Even if you have 6 hours of capacity, if your "Daily Max Tasks" for weekends is set to 2, only 2 tasks will be scheduled.

**Solution:** 
1. Go to Settings
2. Increase "Daily Max Tasks" > Weekend to 4 or more
3. Save and return to dashboard

### Why isn't my Work task scheduled on the weekend?

**Likely Cause:** Weekend category limit for Work is too low

**Check:**
1. Go to Settings
2. Look at Work > Weekend limit
3. If it's 2h and your task is 3h, it won't fit

**Solution:** Increase the weekend limit or break the task into smaller chunks

### Why are high-priority tasks not scheduled for today?

**Possible Causes:**
1. Today already has max tasks (check task count cap)
2. Today's category limit is reached for that category
3. Today's daily hour limit is reached

**Debug:** Check console logs for constraint violations

### Tasks are scheduled way in the future

**Likely Cause:** Daily limits are too restrictive for the number of tasks

**Solution:**
1. Increase daily max hours
2. Increase daily max tasks
3. Increase category limits
4. Or: Complete/delete some tasks to free up capacity

## Best Practices

### Setting Your Limits

1. **Start Conservative**
   - Begin with defaults
   - Observe your completion rate
   - Adjust gradually

2. **Be Realistic**
   - Don't set 16-hour days
   - Leave buffer time for interruptions
   - Weekend ≠ Weekday

3. **Category Balance**
   - Ensure Work doesn't dominate
   - Allocate time for Health and Personal
   - Adjust seasonally if needed

### Task Management

1. **Use Due Dates**
   - Tasks with due dates get prioritized
   - Without due dates, tasks rely on importance/urgency
   
2. **Estimate Hours Accurately**
   - Overestimating is better than underestimating
   - Include setup and cleanup time
   
3. **Mark Importance and Urgency**
   - Drives the Eisenhower matrix scoring
   - Dramatically affects scheduling order

4. **Break Large Tasks**
   - Tasks > daily limit won't fit
   - Break into subtasks
   - Improves completion rate

## Technical Implementation

### Database Schema

```sql
-- profiles table
category_limits jsonb default '{
  "Work": {"weekday": 10, "weekend": 2},
  "Home": {"weekday": 3, "weekend": 4},
  "Health": {"weekday": 3, "weekend": 2},
  "Personal": {"weekday": 2, "weekend": 4}
}'

daily_max_hours jsonb default '{
  "weekday": 10,
  "weekend": 6
}'

daily_max_tasks jsonb default '{
  "weekday": 4,
  "weekend": 4
}'
```

### API Endpoint

`POST /api/settings`

**Request Body:**
```json
{
  "category_limits": {
    "Work": { "weekday": 10, "weekend": 2 },
    "Home": { "weekday": 3, "weekend": 4 },
    "Health": { "weekday": 3, "weekend": 2 },
    "Personal": { "weekday": 2, "weekend": 4 }
  },
  "daily_max_hours": {
    "weekday": 10,
    "weekend": 6
  },
  "daily_max_tasks": {
    "weekday": 4,
    "weekend": 4
  }
}
```

**Validation:**
- Category limits: 0-24 hours
- Daily max hours: 0-24 hours
- Daily max tasks: 1-20 tasks
- All fields required
- All categories required

### Code References

- **Scheduling Algorithm**: `lib/utils/task-prioritization.ts`
- **Settings API**: `app/api/settings/route.ts`
- **Settings Form**: `components/settings/settings-form.tsx`
- **Settings Page**: `app/settings/page.tsx`
- **Type Definitions**: `lib/types.ts`

## Migration

To enable the new settings in an existing database, run the migration:

```sql
-- scripts/003_add_daily_max_tasks.sql
alter table public.profiles
  add column if not exists daily_max_tasks jsonb 
  default '{"weekday": 4, "weekend": 4}'::jsonb;

update public.profiles
set daily_max_tasks = '{"weekday": 4, "weekend": 4}'::jsonb
where daily_max_tasks is null;
```

## Testing

Comprehensive tests are available:

- **Scheduling Logic Tests**: `__tests__/utils/task-prioritization.test.ts`
- **API Tests**: `__tests__/api/settings.test.ts`

Run tests with:
```bash
npm test
```

## Future Enhancements

Potential improvements to consider:

1. **Dynamic Limits**: Adjust limits based on completion history
2. **Focus Time**: Block specific hours for deep work
3. **Energy Levels**: Schedule harder tasks when user has more energy
4. **Context Switching**: Minimize category switches
5. **Team Coordination**: Respect team members' schedules
6. **Time Blocking**: Reserve specific time slots for specific categories

---

**Last Updated:** November 25, 2025  
**Maintained by**: Friday Team


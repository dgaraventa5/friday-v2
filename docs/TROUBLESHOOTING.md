# Troubleshooting Guide

This guide helps you diagnose and fix common issues with task scheduling and settings in Friday.

## Table of Contents

1. [Tasks Not Showing on Today Screen](#tasks-not-showing-on-today-screen)
2. [Settings Not Taking Effect](#settings-not-taking-effect)
3. [Only 2 Tasks Showing Despite Higher Limits](#only-2-tasks-showing-despite-higher-limits)
4. [Debug Tools](#debug-tools)
5. [Understanding Console Logs](#understanding-console-logs)
6. [Database Migration Issues](#database-migration-issues)

---

## Tasks Not Showing on Today Screen

### Symptom
You have tasks in your system, but Today's Focus shows fewer tasks than expected.

### Possible Causes

#### 1. Daily Task Limit Reached
**Check:** Are you at your daily max tasks limit?

**How to verify:**
1. Open browser console (F12 or Cmd+Option+I)
2. Look for logs like: `[v1] Skipping 2025-11-24 - already has 4 tasks`
3. Check your Settings → Daily Max Tasks

**Solution:**
- Go to Settings
- Increase "Daily Max Tasks" for weekday or weekend
- Save and return to dashboard

#### 2. Hour Capacity Filled
**Check:** Have you used all available hours for the day?

**How to verify:**
1. Check console logs for: `totalHours: 6.0/6h`
2. The first number is current, second is your limit

**Solution:**
- Increase Daily Max Hours in Settings
- Or increase specific Category Limits
- Or complete/delete some tasks to free capacity

#### 3. Category Limit Reached
**Check:** Are you at the limit for a specific category?

**How to verify:**
1. Look for: `categoryHours: 2.0/2h` in console
2. This shows Health category is at 2h limit

**Solution:**
- Increase the specific category limit in Settings
- Or spread tasks across different categories

#### 4. Recurring Tasks Filling Slots
**Check:** Do you have recurring tasks taking up slots?

**How to verify:**
1. Check Schedule view to see all tasks for today
2. Recurring tasks show a "recurring" icon
3. Count how many recurring tasks are scheduled for today

**Solution:**
- Recurring tasks are NOT rescheduled by the algorithm
- They count toward your daily task limit
- Increase Daily Max Tasks to allow more tasks alongside recurring ones
- Or reduce/modify recurring tasks

---

## Settings Not Taking Effect

### Symptom
You changed settings and saved, but tasks aren't being rescheduled accordingly.

### Solutions

#### 1. Force Reschedule
After changing settings:
1. Look for the yellow "Debug Tool" banner on Today screen
2. Click "Reschedule All Tasks" button
3. Check console for scheduling output
4. Verify more tasks appear

#### 2. Hard Refresh Browser
Sometimes browser cache causes issues:
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

#### 3. Check Database Migration
If you just added the daily_max_tasks feature:
1. Verify the migration ran: `scripts/003_add_daily_max_tasks.sql`
2. Check Supabase dashboard
3. Query: `SELECT id, daily_max_tasks FROM profiles LIMIT 5;`
4. Should see: `{"weekday": 4, "weekend": 4}`

#### 4. Verify Settings Were Saved
1. Go back to Settings page
2. Check if your changes are still there
3. If not, check Network tab for API errors when you clicked Save

---

## Only 2 Tasks Showing Despite Higher Limits

This is a specific issue that can have multiple causes.

### Diagnostic Steps

#### Step 1: Check Console Logs
1. Open browser console (F12)
2. Reload dashboard
3. Look for:
   ```
   [v0] Profile data: { category_limits: {...}, daily_max_hours: {...}, daily_max_tasks: {...} }
   [v0] Using daily_max_tasks: { weekday: X, weekend: Y }
   ```
4. Verify daily_max_tasks shows your expected values

#### Step 2: Check Actual Task Scheduling
Look for these log patterns:
```
[v1] Attempting to schedule: "Task Name" (Category, 1h, priority: 145)
[v1]   Checking 2025-11-24 (weekend):
        tasks: 2/4
        categoryHours: 2.0/6h
        totalHours: 2.0/6h
        canFit: true/false
```

The output will tell you exactly why tasks can't fit.

#### Step 3: Common Scenarios

**Scenario A: Task count limit**
```
[v1] Skipping 2025-11-24 - already has 4 tasks (weekend limit)
```
→ Your daily_max_tasks.weekend is set to 4, but 4 tasks are already scheduled

**Scenario B: Category hours exceeded**
```
[v1]   Cannot fit: category ✗, daily ✓
```
→ Category limit reached (e.g., Personal category has 2h limit, already used)

**Scenario C: Daily hours exceeded**
```
[v1]   Cannot fit: category ✓, daily ✗
```
→ Total daily hours limit reached

#### Step 4: Use Manual Reschedule
1. Find the yellow debug banner on Today screen
2. Click "Reschedule All Tasks"
3. Watch console for detailed output
4. This forces a full recalculation

### Root Cause: Recurring Tasks

If you have 2 recurring tasks:
- They're scheduled for specific days (not moved by algorithm)
- They count toward your daily task limit
- If limit is 4, only 2 more non-recurring tasks can fit

**Solution:**
- Increase Daily Max Tasks to 6 or 8
- Or reduce recurring tasks
- Or modify recurring schedule (e.g., move to different days)

---

## Debug Tools

### Manual Reschedule Button

A yellow debug banner appears on the Today screen:

```
Debug Tool: If tasks aren't showing correctly, click here to force a full reschedule.
[Reschedule All Tasks]
```

**When to use:**
- After changing settings
- When tasks seem stuck
- To verify current limits are being applied

**What it does:**
- Forces complete recalculation of all task schedules
- Uses current profile limits from database
- Updates database with new start_dates
- Shows detailed console output

### Browser Console Logging

The app provides extensive logging. Open console to see:

**Profile Loading:**
```
[v0] Profile data: {
  category_limits: {...},
  daily_max_hours: {...},
  daily_max_tasks: {...},
  daily_max_tasks_type: "object",
  daily_max_tasks_is_null: false
}
```

**Scheduling Decisions:**
```
[v1] Attempting to schedule: "Work out" (Health, 1h, priority: 165)
[v1]   Checking 2025-11-24 (weekend):
        tasks: 2/4
        categoryHours: 1.0/2h
        totalHours: 2.0/6h
        canFit: true
[v1] ✓ Scheduled "Work out" on 2025-11-24 (priority: 165, tasks: 3/4)
```

**Constraint Violations:**
```
[v1]   Cannot fit: category ✗, daily ✓
```

---

## Understanding Console Logs

### Log Prefixes

- `[v0]` = Dashboard/component level logs
- `[v1]` = Scheduling algorithm logs
- `[Dashboard]` = Server-side dashboard page logs

### Key Metrics in Logs

**Task Count:**
```
tasks: 2/4
```
- First number: Current tasks scheduled for this day
- Second number: Maximum allowed (from daily_max_tasks)

**Category Hours:**
```
categoryHours: 3.0/10h
```
- First number: Hours used in this category
- Second number: Category limit for this day type

**Total Hours:**
```
totalHours: 5.5/10h
```
- First number: Total hours scheduled for this day
- Second number: Daily max hours limit

**Can Fit:**
```
canFit: true
```
- `true` = All constraints allow this task
- `false` = At least one constraint blocks this task

---

## Database Migration Issues

### Symptom
`daily_max_tasks` is `null` or `undefined` in console logs.

### Cause
Database migration `003_add_daily_max_tasks.sql` wasn't run or failed.

### Solution

#### 1. Check if Column Exists
In Supabase SQL Editor:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'daily_max_tasks';
```

Should return one row showing the column exists.

#### 2. Check Current Values
```sql
SELECT id, email, daily_max_tasks 
FROM profiles 
LIMIT 10;
```

Should show values like: `{"weekday": 4, "weekend": 4}`

#### 3. Run Migration
If column is missing or values are null:

```sql
-- Add column with default
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_max_tasks jsonb 
  DEFAULT '{"weekday": 4, "weekend": 4}'::jsonb;

-- Update existing rows
UPDATE public.profiles
SET daily_max_tasks = '{"weekday": 4, "weekend": 4}'::jsonb
WHERE daily_max_tasks IS NULL;
```

#### 4. Verify Fix
1. Hard refresh browser (`Cmd + Shift + R`)
2. Go to Settings
3. Verify "Daily Max Tasks" section appears
4. Check console logs for profile data

---

## Common Error Messages

### "Settings saved successfully! Redirecting..."
✅ **Success** - Settings were saved to database

### "Failed to save settings. Please try again."
❌ **Error** - Check:
1. Network tab for API errors
2. Are you logged in?
3. Is Supabase reachable?

### "Task scheduled on due date but exceeds capacity limits"
⚠️ **Warning** - Task was forced onto due date despite exceeding limits

### "Task could not be scheduled. Please adjust capacity limits"
❌ **Error** - No available slot found within 90 days

---

## Still Having Issues?

### Gather Debug Information

1. **Console Logs:**
   - Open console
   - Reload dashboard
   - Click "Reschedule All Tasks"
   - Copy all output

2. **Current Settings:**
   - Go to Settings page
   - Screenshot your current limits

3. **Database State:**
   - Check Supabase dashboard
   - Run: `SELECT * FROM profiles WHERE id = 'your-user-id';`
   - Note the values

4. **Task Count:**
   - How many tasks total?
   - How many recurring?
   - How many scheduled for today?

### Check the Documentation

- **Settings Guide:** `docs/SETTINGS_AND_SCHEDULING.md`
- **Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`
- **Migration Instructions:** `MIGRATION_INSTRUCTIONS.md`

---

**Last Updated:** November 25, 2025  
**Version:** 2.0 (with configurable daily_max_tasks)


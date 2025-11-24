# Scheduling Issue Fixes - Implementation Summary

## Problem Statement

User reported seeing only 2 tasks on Today screen (Sunday) despite:
- Daily Max Tasks set to 4
- 6 hours of weekend capacity available
- Multiple tasks in the system

## Root Cause Analysis

After investigation, identified **multiple potential issues**:

1. **Profile Data Not Refreshing** - After settings save, dashboard wasn't reloading fresh profile data
2. **Null Handling** - `daily_max_tasks` field could be `null`/`undefined` and fallback wasn't robust
3. **No Debug Visibility** - No way to see what was actually happening during scheduling
4. **Cache Issues** - Next.js page caching prevented fresh data loads
5. **Recurring Tasks** - User's 2 recurring tasks may have been the only ones scheduled

## Fixes Implemented

### Phase 1: Debug & Visibility

#### 1. Enhanced Profile Logging
**File**: `components/dashboard/dashboard-client.tsx`

Added comprehensive logging on dashboard load:
```typescript
console.log('[v0] Profile data:', {
  category_limits: profile.category_limits,
  daily_max_hours: profile.daily_max_hours,
  daily_max_tasks: profile.daily_max_tasks,
  daily_max_tasks_type: typeof profile.daily_max_tasks,
  daily_max_tasks_is_null: profile.daily_max_tasks === null,
  daily_max_tasks_is_undefined: profile.daily_max_tasks === undefined,
});
```

Now users can see exactly what limits are being used.

#### 2. Manual Reschedule Button
**File**: `components/dashboard/dashboard-client.tsx`

Added prominent debug button on Today screen:
- Yellow banner with clear instructions
- "Reschedule All Tasks" button
- Forces full recalculation with current limits
- Shows detailed console output

**Usage**: After changing settings, click this button to force reschedule without page reload.

### Phase 2: Core Fixes

#### 3. Robust Null/Undefined Handling
**Files**: `components/dashboard/dashboard-client.tsx` (5 locations)

Replaced simple fallback:
```typescript
// OLD (could fail):
profile.daily_max_tasks || { weekday: 4, weekend: 4 }

// NEW (robust):
const dailyMaxTasks = profile.daily_max_tasks && 
  typeof profile.daily_max_tasks === 'object' &&
  'weekday' in profile.daily_max_tasks &&
  'weekend' in profile.daily_max_tasks &&
  typeof profile.daily_max_tasks.weekday === 'number' &&
  typeof profile.daily_max_tasks.weekend === 'number'
    ? profile.daily_max_tasks
    : { weekday: 4, weekend: 4 };
```

Now handles:
- `null` values
- `undefined` values
- Empty objects `{}`
- Partial objects `{ weekday: 4 }` (missing weekend)
- Wrong types `{ weekday: '4', weekend: 4 }`

#### 4. Force Profile Refresh
**File**: `app/dashboard/page.tsx`

Added:
```typescript
export const dynamic = 'force-dynamic'; // Disable caching
```

And:
```typescript
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { updated?: string };
}) {
  // Always fetch fresh profile (not cached)
  // Log if returning from settings
  if (searchParams.updated) {
    console.log('[Dashboard] Loading after settings update, profile data:', {...});
  }
}
```

Now when settings form navigates back with `?updated=timestamp`, dashboard:
1. Fetches fresh profile from database
2. Logs the data for verification
3. Triggers scheduling with new limits

### Phase 3: Comprehensive Testing

#### 5. Migration Tests
**File**: `__tests__/migrations/003_daily_max_tasks.test.ts`

Tests verify:
- Column exists with correct type (jsonb)
- Default values are set
- Existing rows get updated
- Invalid data is rejected
- Migration is idempotent

#### 6. E2E Settings Flow Tests
**File**: `__tests__/integration/settings-flow.test.ts`

Tests cover:
- Initial state with default settings
- Changing settings and seeing effect
- Settings persistence
- Null/undefined handling
- Real-world user scenario (2 tasks → should show more)

#### 7. Profile Data Flow Tests
**File**: `__tests__/integration/profile-loading.test.ts`

Tests verify:
- Complete profile structure
- Fallback handling for missing fields
- Data type validation
- Database JSON parsing
- Edge cases (extreme values, null, undefined)

#### 8. Recurring Task Interaction Tests
**File**: `__tests__/utils/recurring-task-scheduling.test.ts`

Tests confirm:
- Recurring tasks count toward daily limit
- Non-recurring tasks fill remaining slots
- Hour limits work with recurring tasks
- Priority scheduling with mix of both types
- User's exact scenario

### Phase 4: Documentation

#### 9. Troubleshooting Guide
**File**: `docs/TROUBLESHOOTING.md`

Comprehensive guide covering:
- Tasks not showing → diagnostic steps
- Settings not taking effect → solutions
- Only 2 tasks showing → root cause analysis
- Debug tools → how to use
- Console logs → how to read
- Database migration → how to verify

## How to Use the Fixes

### For the User

1. **Check Console Logs**
   - Open browser console (F12 or Cmd+Option+I)
   - Reload dashboard
   - Look for `[v0] Profile data:` log
   - Verify `daily_max_tasks` shows your expected values

2. **Use Manual Reschedule**
   - Look for yellow debug banner on Today screen
   - Click "Reschedule All Tasks" button
   - Watch console for detailed output
   - Verify more tasks appear

3. **Hard Refresh Browser**
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + R`
   - Clears any cached data

4. **Verify Database**
   - Go to Supabase SQL Editor
   - Run: `SELECT id, daily_max_tasks FROM profiles WHERE id = 'your-id';`
   - Should see: `{"weekday": 4, "weekend": 4}` (or your custom values)

### What Changed

**Before:**
- Settings save → navigate back → stale data → wrong limits used
- No visibility into why tasks weren't scheduled
- Null values could break scheduling
- No way to force refresh

**After:**
- Settings save → navigate back → fresh data → correct limits used
- Comprehensive console logging shows exactly what's happening
- Robust null handling prevents errors
- Manual reschedule button for instant recalculation

## Expected Behavior Now

With the fixes, the user should:

1. **See accurate logging:**
   ```
   [v0] Profile data: { ..., daily_max_tasks: { weekday: 4, weekend: 4 } }
   [v0] Using daily_max_tasks: { weekday: 4, weekend: 4 }
   ```

2. **See scheduling decisions:**
   ```
   [v1] Attempting to schedule: "Groceries" (Home, 1.5h, priority: 145)
   [v1]   Checking 2025-11-24 (weekend):
           tasks: 2/4
           categoryHours: 1.5/6h
           totalHours: 2.5/6h
           canFit: true
   [v1] ✓ Scheduled "Groceries" on 2025-11-24 (priority: 145, tasks: 3/4)
   ```

3. **Have 4 tasks on Sunday** (with default limit of 4):
   - 2 recurring tasks (already there)
   - 2 highest-priority non-recurring tasks
   - Total respecting hour and category limits

4. **Be able to increase limit:**
   - Go to Settings
   - Set Daily Max Tasks > Weekend to 6
   - Click Save
   - Click "Reschedule All Tasks" button
   - See up to 6 tasks scheduled for Sunday

## Files Modified

### Core Functionality
- `components/dashboard/dashboard-client.tsx` - Logging, null handling, manual reschedule
- `app/dashboard/page.tsx` - Force dynamic, handle URL params

### Tests (New Files)
- `__tests__/migrations/003_daily_max_tasks.test.ts`
- `__tests__/integration/settings-flow.test.ts`
- `__tests__/integration/profile-loading.test.ts`
- `__tests__/utils/recurring-task-scheduling.test.ts`

### Documentation (New File)
- `docs/TROUBLESHOOTING.md`

## Next Steps for User

1. **Hard refresh browser** - `Cmd + Shift + R`
2. **Open console** - Check logs
3. **Click reschedule button** - Force recalculation
4. **Check console output** - See what's happening
5. **Report findings** - Share console logs if still having issues

## Why Tests Didn't Catch This Originally

1. **Unit tests in isolation** - Tested algorithm but not data flow
2. **No E2E tests** - Didn't test settings → database → dashboard journey
3. **No migration tests** - Assumed database changes work correctly
4. **No profile loading tests** - Assumed Supabase returns correct data
5. **No recurring task interaction tests** - Didn't test mixed scenarios

**Now fixed** - Comprehensive test suites cover all these gaps.

---

**Status**: ✅ All fixes implemented and tested  
**Date**: November 25, 2025  
**Ready for user testing**: Yes


# Plan: Fix Reminder Completions Timezone Bug

## Root Cause

The reminder completions bug is caused by a **timezone mismatch** between client and server:

1. `getTodayLocal()` uses `new Date()` which returns different results:
   - **Browser**: User's local timezone (e.g., PST)
   - **Vercel Server**: UTC timezone

2. When user completes a reminder at 10pm PST:
   - Client saves completion with date "2026-01-15" (correct)
   - On refresh, server calculates "today" as "2026-01-16" (UTC)
   - Server fetches completions for wrong date → shows nothing

This explains why Tasks work but Reminders don't: Tasks store `start_date` from the client and filter on it, while reminder completions are fetched using server-calculated "today".

## Solution

Store the user's timezone in their profile, then use it server-side to calculate the correct "today".

### Step 1: Add timezone field to profiles table

```sql
ALTER TABLE profiles ADD COLUMN timezone TEXT DEFAULT 'America/Los_Angeles';
```

### Step 2: Update Profile type

In `lib/types.ts`, add `timezone` field to Profile interface.

### Step 3: Capture timezone on client

In `DashboardClient`, detect user's timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone` and store it in profile if not set.

### Step 4: Create timezone-aware date utility

Add `getTodayForTimezone(timezone: string)` function that calculates "today" for a specific timezone.

### Step 5: Update dashboard page to use user's timezone

In `app/dashboard/page.tsx`, use `profile.timezone` instead of `getTodayLocal()` when fetching completions.

## Implementation Details

### New utility function (lib/utils/date-utils.ts):

```typescript
/**
 * Get today's date for a specific timezone
 */
export function getTodayForTimezone(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { // en-CA uses YYYY-MM-DD
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}
```

### Dashboard page change:

```typescript
// Use user's timezone instead of server's local time
const userTimezone = profile?.timezone || 'America/Los_Angeles';
const todayStr = getTodayForTimezone(userTimezone);
```

### Timezone capture (DashboardClient):

```typescript
useEffect(() => {
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (profile && !profile.timezone) {
    // Update profile with detected timezone
    updateProfile({ timezone: browserTimezone });
  }
}, [profile]);
```

## Files to Modify

1. `scripts/012_add_timezone_to_profiles.sql` - Migration to add timezone column
2. `lib/types.ts` - Add timezone to Profile type
3. `lib/utils/date-utils.ts` - Add `getTodayForTimezone()` function
4. `app/dashboard/page.tsx` - Use user's timezone for fetching completions
5. `components/dashboard/dashboard-client.tsx` - Capture and sync timezone

## Testing Plan

1. Run SQL migration in Supabase
2. Build and deploy
3. Test at different times:
   - During daytime (when client/server dates match) - should work
   - Late evening PST (when UTC is next day) - should now work correctly
4. Verify old completions still display correctly

## Risk Assessment

- **Low risk**: Changes are additive (new column with default value)
- **Backwards compatible**: Default timezone handles existing users
- **No data migration needed**: Just adds new column

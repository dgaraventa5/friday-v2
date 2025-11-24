# Migration Instructions

## Database Migration Required

To enable the new configurable daily max tasks feature, you need to run a database migration.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://fmqcycrvfeuhqrybhyvh.supabase.co
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `scripts/003_add_daily_max_tasks.sql`
5. Click "Run" or press `Cmd/Ctrl + Enter`
6. Verify success (should see "Success. No rows returned")

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push scripts/003_add_daily_max_tasks.sql
```

### Migration SQL

```sql
-- Add daily_max_tasks field to profiles table
-- This allows users to configure the maximum number of tasks per day (weekday/weekend)
-- Default is 4 tasks per day for both weekday and weekend

alter table public.profiles
  add column if not exists daily_max_tasks jsonb default '{"weekday": 4, "weekend": 4}'::jsonb;

-- Update existing profiles to have the default value if they don't have it yet
update public.profiles
set daily_max_tasks = '{"weekday": 4, "weekend": 4}'::jsonb
where daily_max_tasks is null;
```

## Verification

After running the migration, verify it worked:

1. In Supabase SQL Editor, run:
```sql
SELECT id, daily_max_tasks FROM public.profiles LIMIT 5;
```

2. You should see the `daily_max_tasks` column with values like:
```json
{"weekday": 4, "weekend": 4}
```

## Next Steps

1. Run the migration (above)
2. Restart your development server: `npm run dev`
3. Go to Settings and test the new Daily Max Tasks section
4. Check the browser console for debug logs showing the new limits being used

## Troubleshooting

### Error: column "daily_max_tasks" already exists

This is safe to ignore - the migration uses `IF NOT EXISTS` so it won't create duplicates.

### Error: permission denied

Make sure you're logged into Supabase with an account that has database admin permissions.

### Settings not reflecting in scheduling

1. Check browser console for any errors
2. Try hard refresh (`Cmd + Shift + R`)
3. Verify the migration ran successfully
4. Check that settings were saved (look at Network tab when clicking Save)


# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Friday is a task management app that uses the Eisenhower Matrix (urgency + importance) to automatically prioritize tasks. The core value proposition is surfacing the user's top 4 daily tasks based on a sophisticated scoring algorithm, eliminating decision paralysis.

## Key Commands

```bash
# Development
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run Jest tests
npm run test:recurring   # Test recurring task generation logic
npm run test:scheduling  # Test task scheduling algorithm

# Linting
npm run lint             # Run ESLint
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL + Auth)
- **UI Components**: Radix UI primitives
- **Date Handling**: date-fns 4.1.0 (all dates stored as YYYY-MM-DD strings in local time)

### Core Data Model

**Task** (`lib/types.ts`):
- `importance`: 'important' | 'not-important'
- `urgency`: 'urgent' | 'not-urgent'
- `start_date`: When the task is scheduled (YYYY-MM-DD)
- `due_date`: Deadline (YYYY-MM-DD)
- `pinned_date`: If manually pinned to a date (prevents rescheduling)
- `estimated_hours`: Time estimate (affects duration pressure)
- `category`: 'Work' | 'Home' | 'Health' | 'Personal'
- Recurring fields: `is_recurring`, `recurring_series_id`, `recurring_interval`, `recurring_days`, `recurring_end_type`, `recurring_end_count`

**Profile** (`lib/types.ts`):
- Streak tracking: `current_streak`, `longest_streak`, `last_completion_date`
- Capacity limits: `category_limits` (hours per category), `daily_max_hours`, `daily_max_tasks`
- `onboarding_completed`: Flag for first-time setup flow

### Directory Structure

```
app/
├── api/              # API routes (settings, streak)
├── auth/             # Supabase auth pages (login, signup, callback)
├── dashboard/        # Main task management interface
└── settings/         # User configuration

components/
├── dashboard/        # Task list, quadrant views, task cards
├── today/            # Daily focus view (top 4 tasks)
├── task/             # Task form, task edit dialog
├── settings/         # Settings forms (limits, profile)
├── reminders/        # Recurring reminder system
└── ui/               # Shadcn UI components (radix-based)

lib/
├── services/         # Service layer for data operations
│   ├── tasks-service.ts      # CRUD operations for tasks
│   ├── reminders-service.ts  # CRUD for reminders
│   ├── profile-service.ts    # User profile operations
│   └── index.ts              # Service factory
├── utils/
│   ├── task-prioritization.ts  # Core scoring algorithm (see below)
│   ├── recurring-tasks.ts      # Recurrence logic
│   ├── streak-tracking.ts      # Daily streak calculations
│   ├── date-utils.ts           # Local date helpers
│   └── scheduling/             # Scheduling system (see below)
│       ├── context.ts          # Capacity tracking
│       ├── partition.ts        # Task categorization
│       ├── strategy.ts         # Greedy scheduling algorithm
│       └── README.md           # Detailed scheduling docs
├── supabase/         # Supabase client configuration
│   ├── client.ts     # Browser client
│   ├── server.ts     # Server client (RSC, Server Actions)
│   └── middleware.ts # Auth middleware
└── types.ts          # Core TypeScript types

scripts/              # SQL migrations (run in order: 001, 002, 003...)
```

## Core Algorithms

### 1. Task Prioritization (`lib/utils/task-prioritization.ts`)

The `calculatePriorityScore()` function combines four factors:

1. **Base Score (40-100)**: Eisenhower quadrant
   - Q1 (urgent + important): 100
   - Q2 (important, not urgent): 80
   - Q3 (urgent, not important): 60
   - Q4 (neither): 40

2. **Due Date Score (0-200+)**: Exponential urgency as deadlines approach
   - Overdue: 200 + (25 × days overdue) - guarantees top priority
   - Due today: +150
   - Due in 1-3 days: +100 to +140
   - Due in 4-7 days: +50 to +90
   - Due in 8-14 days: +25 to +50
   - Due in 15-30 days: +5 to +20
   - 30+ days: +5

3. **Duration Pressure (0-120+)**: Large tasks with approaching deadlines
   - Formula: `(estimated_hours / max(days_until_due, 0.5)) × 15`
   - Ensures 8-hour task due tomorrow gets scheduled early

4. **Age Factor (0-10)**: Prevents task starvation
   - +1 per day old, capped at +10

**Total range**: ~40 to 330+ (extreme cases), typically 40-180

### 2. Task Scheduling (`lib/utils/scheduling/`)

The scheduling system assigns `start_date` to tasks based on priority and capacity constraints:

- **Partition** (`partition.ts`): Groups tasks into completed, recurring, pinned (locked dates), and to-schedule
- **Context** (`context.ts`): Tracks daily capacity (hours, task count, category limits)
- **Strategy** (`strategy.ts`): Greedy algorithm schedules highest-priority tasks first within capacity limits

Key behaviors:
- Completed tasks count toward daily capacity (they occupied time/slots)
- Pinned tasks cannot be rescheduled
- Tasks with `due_date` are scheduled before their deadline if possible
- Category limits (weekday/weekend hours) are respected
- Daily max tasks (default 4) prevents overcommitment

**Important**: The 4-task limit is enforced during scheduling, not during display. Users can manually pull additional tasks if desired.

### 3. Recurring Tasks (`lib/utils/recurring-tasks.ts`)

System generates future instances of recurring tasks:
- **Daily**: Creates tasks for consecutive days
- **Weekly**: Creates tasks on specified weekdays (Sunday=0, Saturday=6)
- **Monthly**: Creates tasks on the same day each month

Deduplication logic removes duplicate instances based on `recurring_series_id` + date combination.

### 4. Streak Tracking (`lib/utils/streak-tracking.ts`)

Calculates daily completion streaks:
- Completing ≥1 task per day maintains the streak
- Missing a day resets `current_streak` to 0
- `longest_streak` tracks all-time record

## Service Layer Pattern

All data operations go through service classes (`lib/services/`):
- Each service extends `BaseService` (error handling)
- Services return `ServiceResult<T>` (success/error union type)
- Factory pattern: `createServices(supabase)` creates all services with shared client

Example:
```typescript
const services = createServices(supabase);
const result = await services.tasks.getTasksByUserId(userId);
if (result.success) {
  const tasks = result.data;
}
```

## Database Migrations

Run SQL files in `scripts/` in numerical order:
1. `001_create_tables.sql` - Core schema (profiles, tasks)
2. `002_add_eisenhower_and_recurring_fields.sql` - Priority + recurrence
3. `003_add_daily_max_tasks.sql` - Task limit config
4. `007_add_pinned_date.sql` - Manual pinning
5. `008_cleanup_duplicate_recurring_tasks.sql` - Deduplication
6. `009_create_reminders.sql` - Reminder system

Execute via Supabase SQL Editor or `psql`.

## Important Patterns

### Date Handling
- All dates stored as `YYYY-MM-DD` strings (local time, no timezones)
- Use `date-utils.ts` helpers: `getTodayLocal()`, `formatDateLocal()`, `parseDateLocal()`
- Never use `new Date().toISOString()` directly - it uses UTC

### Supabase Clients
- **Browser**: `createBrowserClient()` from `lib/supabase/client.ts`
- **Server Components**: `createClient()` from `lib/supabase/server.ts`
- **Middleware**: Uses special SSR client from `lib/supabase/middleware.ts`

### Task Updates
- After modifying tasks, call scheduling algorithm to reassign `start_date`
- Use `assignStartDates()` to reschedule incomplete tasks
- Pinned tasks (with `pinned_date`) are never rescheduled

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

See `.env.example` for reference.

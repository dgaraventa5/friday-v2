# Product Requirements Document: Reminders Feature for Friday

**Version:** 1.0  
**Date:** December 9, 2025  
**Status:** Draft  

---

## 1. Overview

### 1.1 Problem Statement

Friday currently excels at helping users prioritize their to-do list through the Eisenhower Matrix methodology. However, users have recurring habits and routines—such as working out, taking medication, picking up kids from school, or taking out the trash—that don't fit the traditional "task" model. These items:

- Don't require prioritization against other tasks
- Repeat on predictable schedules
- Are "checklist" items rather than "work" items
- Benefit from streak/consistency tracking

### 1.2 Proposed Solution

Introduce a new "Reminders" feature that allows users to track recurring habits and routines separately from their prioritized task list. Reminders will appear on the Today screen alongside Tasks but in a distinct section, making it clear that these are different types of items with different purposes.

### 1.3 Goals

1. Enable users to track recurring habits without polluting their prioritized task queue
2. Provide flexible scheduling options (daily, weekly, monthly) with custom intervals
3. Integrate with existing streak tracking to encourage consistency
4. Maintain Friday's clean, distraction-free UI philosophy

### 1.4 Non-Goals (v1)

- Push notifications or native device reminders
- Pause/vacation mode for reminders
- Location-based reminders
- Reminder categories/tags

---

## 2. User Stories

### 2.1 Core User Stories

| ID | User Story |
|----|------------|
| US-1 | As a user, I want to create a recurring reminder so that I can track habits that repeat on a schedule. |
| US-2 | As a user, I want to see my reminders for today on the Today screen so that I know what habits to complete. |
| US-3 | As a user, I want to mark a reminder as complete so that I can track my progress. |
| US-4 | As a user, I want to skip a reminder for today so that missed days don't carry over. |
| US-5 | As a user, I want completing a reminder to count toward my streak so that I stay motivated. |
| US-6 | As a user, I want to edit or delete reminders so that I can adjust my habits over time. |
| US-7 | As a user, I want to optionally set a time label on a reminder so that I know when to do it. |

---

## 3. Functional Requirements

### 3.1 Reminder Data Model

Each Reminder consists of the following attributes:

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Unique identifier |
| `user_id` | uuid | Reference to auth.users |
| `title` | text | Name of the reminder (e.g., "Take medication") |
| `time_label` | time (nullable) | Optional time display (e.g., "08:00") |
| `recurrence_type` | enum | 'daily' \| 'weekly' \| 'monthly' |
| `recurrence_interval` | integer | Interval multiplier (e.g., 2 for "every 2 weeks") |
| `recurrence_days` | integer[] | For weekly: days of week (0-6). For monthly: day of month or null |
| `monthly_type` | enum (nullable) | 'day_of_month' \| 'nth_weekday' (e.g., 2nd Tuesday) |
| `monthly_week_position` | integer (nullable) | Week position for nth_weekday (1-4, or -1 for last) |
| `end_type` | enum | 'never' \| 'after' |
| `end_count` | integer (nullable) | Number of occurrences if end_type='after' |
| `current_count` | integer | Current occurrence count |
| `is_active` | boolean | Whether the reminder is currently active |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

### 3.2 Reminder Completions Table

Track daily completions for each reminder:

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Unique identifier |
| `reminder_id` | uuid | Reference to reminders table |
| `completion_date` | date | The date this reminder was completed |
| `status` | enum | 'completed' \| 'skipped' |
| `completed_at` | timestamptz | Timestamp of completion/skip action |

### 3.3 Recurrence Logic

#### 3.3.1 Daily Recurrence
- Reminder appears every N days based on `recurrence_interval`
- Example: "Every 1 day" = daily, "Every 2 days" = every other day

#### 3.3.2 Weekly Recurrence
- User selects specific days of the week (Sun=0 through Sat=6)
- `recurrence_interval` determines week gap (e.g., every 2 weeks)
- Example: "Every 1 week on Mon, Wed, Fri" = M/W/F weekly

#### 3.3.3 Monthly Recurrence
Two modes supported:
- **Day of month:** Reminder on specific day (e.g., 15th of every month)
- **Nth weekday:** Reminder on position + weekday (e.g., "2nd Tuesday" or "last Friday")

### 3.4 Determining Today's Reminders

To determine which reminders appear on the Today screen:

1. Fetch all active reminders for the user
2. For each reminder, calculate if today matches the recurrence pattern
3. Check `reminder_completions` for today's date to determine completion status
4. Return reminders scheduled for today with their completion status

**Important:** Users should only see reminders scheduled for the current day. They cannot see past or future reminder occurrences.

### 3.5 Streak Integration

The existing streak system should be updated:

- A day counts toward the streak if the user completes at least 1 Task OR 1 Reminder scheduled for that day
- Skipped reminders do NOT count toward streaks
- Only reminders scheduled for today (not created mid-day and immediately completed) count

---

## 4. UI/UX Requirements

### 4.1 Today Screen Layout

#### 4.1.1 Mobile & Tablet (< 1024px)

Single column layout with two clearly labeled sections:

1. **Reminders Section (Top):** Header with "Reminders" label and "+" icon button to add new reminders
2. **Tasks Section (Below):** Existing "Today's Focus" section with task cards

```
┌─────────────────────────────┐
│ Reminders              [+]  │
├─────────────────────────────┤
│ ○ Take medication   8:00 AM │
│ ● Workout          (done)   │
│ ○ Walk the dog              │
├─────────────────────────────┤
│ Today's Focus               │
├─────────────────────────────┤
│ Task Card 1                 │
│ Task Card 2                 │
│ Task Card 3                 │
│ Task Card 4                 │
└─────────────────────────────┘
```

#### 4.1.2 Desktop (≥ 1024px)

Two-column layout:

- **Main Column (larger, ~70%):** Tasks section with full task cards
- **Sidebar Column (~30%):** Reminders section in a compact sidebar format

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  ┌─────────────────────────────┐  ┌─────────────────┐  │
│  │ Today's Focus               │  │ Reminders   [+] │  │
│  ├─────────────────────────────┤  ├─────────────────┤  │
│  │                             │  │ ○ Take meds     │  │
│  │  Task Card 1                │  │ ● Workout ✓     │  │
│  │                             │  │ ○ Walk dog      │  │
│  │  Task Card 2                │  │                 │  │
│  │                             │  └─────────────────┘  │
│  │  Task Card 3                │                       │
│  │                             │                       │
│  │  Task Card 4                │                       │
│  │                             │                       │
│  └─────────────────────────────┘                       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

This ensures Tasks remain prominently displayed while Reminders are visible and accessible.

### 4.2 Reminder Card Component

Each reminder card should display:

- Checkbox (circular, similar to task cards)
- Reminder title
- Time label (if set, displayed in muted text)
- Repeat indicator icon (to distinguish from one-time tasks)
- 3-dot menu with: Edit, Skip Today, Delete options

### 4.3 Add Reminder Modal

Triggered by clicking the "+" icon next to the Reminders header. Modal should include:

#### 4.3.1 Basic Fields
- **Reminder Name:** Text input (required)
- **Time:** Time picker (optional) - displayed as label only, no notifications

#### 4.3.2 Recurrence Fields
- **Repeat every:** Number input + dropdown (day/week/month)
- **Repeat on (weekly):** Day-of-week pill buttons (S M T W T F S)
- **Monthly mode (monthly):** Dropdown with options like "Monthly on day 15" or "Monthly on the second Tuesday"

Reference UI (similar to Google Calendar):
```
┌─────────────────────────────────────┐
│ Add Reminder                        │
├─────────────────────────────────────┤
│ Reminder Name                       │
│ ┌─────────────────────────────────┐ │
│ │ Take medication                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Time (optional)                     │
│ ┌─────────────────────────────────┐ │
│ │ 8:00 AM                         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Repeat every                        │
│ ┌─────┐ ┌─────────────────────────┐ │
│ │  1  │ │ day            ▼       │ │
│ └─────┘ └─────────────────────────┘ │
│                                     │
│ Ends                                │
│ ◉ Never                             │
│ ○ After [  10  ] occurrences        │
│                                     │
│         [Cancel]  [Save]            │
└─────────────────────────────────────┘
```

Weekly view with day selection:
```
│ Repeat every                        │
│ ┌─────┐ ┌─────────────────────────┐ │
│ │  1  │ │ week           ▼       │ │
│ └─────┘ └─────────────────────────┘ │
│                                     │
│ Repeat on                           │
│ (S) (M) (T) (W) (T) (F) (S)        │
│  ○   ●   ○   ●   ○   ●   ○         │
```

Monthly view with type selection:
```
│ Repeat every                        │
│ ┌─────┐ ┌─────────────────────────┐ │
│ │  1  │ │ month          ▼       │ │
│ └─────┘ └─────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Monthly on the second Tuesday ▼│ │
│ └─────────────────────────────────┘ │
│   Options:                          │
│   - Monthly on day 9                │
│   - Monthly on the second Tuesday   │
```

#### 4.3.3 End Condition
- **Never:** Radio button (default)
- **After X occurrences:** Radio button + number input

### 4.4 Edit Reminder Modal

Same layout as Add Reminder modal, pre-populated with existing values. Accessible via 3-dot menu → Edit.

### 4.5 Completion States

| State | Visual Treatment | Behavior |
|-------|------------------|----------|
| Incomplete | Empty checkbox, normal text | Click checkbox to complete |
| Completed | Checked checkbox, strikethrough text, muted color | Can uncheck to undo |
| Skipped | "Skipped" badge, dimmed card | Can undo skip via menu |

---

## 5. Technical Implementation

### 5.1 Database Schema (Supabase/PostgreSQL)

```sql
-- Create reminders table
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  time_label TIME,
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
  recurrence_interval INTEGER NOT NULL DEFAULT 1,
  recurrence_days INTEGER[],
  monthly_type TEXT CHECK (monthly_type IN ('day_of_month', 'nth_weekday')),
  monthly_week_position INTEGER,
  end_type TEXT NOT NULL DEFAULT 'never' CHECK (end_type IN ('never', 'after')),
  end_count INTEGER,
  current_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create reminder_completions table
CREATE TABLE public.reminder_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'skipped')),
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reminder_id, completion_date)
);

-- Enable RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for reminders
CREATE POLICY "reminders_select_own" ON public.reminders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reminders_insert_own" ON public.reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reminders_update_own" ON public.reminders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reminders_delete_own" ON public.reminders
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for reminder_completions (via reminder ownership)
CREATE POLICY "reminder_completions_select_own" ON public.reminder_completions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.reminders WHERE id = reminder_id AND user_id = auth.uid())
  );
CREATE POLICY "reminder_completions_insert_own" ON public.reminder_completions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.reminders WHERE id = reminder_id AND user_id = auth.uid())
  );
CREATE POLICY "reminder_completions_update_own" ON public.reminder_completions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.reminders WHERE id = reminder_id AND user_id = auth.uid())
  );
CREATE POLICY "reminder_completions_delete_own" ON public.reminder_completions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.reminders WHERE id = reminder_id AND user_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX reminders_user_id_idx ON public.reminders(user_id);
CREATE INDEX reminders_is_active_idx ON public.reminders(is_active);
CREATE INDEX reminder_completions_reminder_id_idx ON public.reminder_completions(reminder_id);
CREATE INDEX reminder_completions_date_idx ON public.reminder_completions(completion_date);
```

### 5.2 TypeScript Interfaces

Add to `lib/types.ts`:

```typescript
export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  time_label: string | null; // Format: "HH:MM:SS"
  recurrence_type: 'daily' | 'weekly' | 'monthly';
  recurrence_interval: number;
  recurrence_days: number[] | null;
  monthly_type: 'day_of_month' | 'nth_weekday' | null;
  monthly_week_position: number | null; // 1-4 or -1 for last
  end_type: 'never' | 'after';
  end_count: number | null;
  current_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReminderCompletion {
  id: string;
  reminder_id: string;
  completion_date: string; // Format: "YYYY-MM-DD"
  status: 'completed' | 'skipped';
  completed_at: string;
}

export interface ReminderWithStatus extends Reminder {
  todayStatus: 'incomplete' | 'completed' | 'skipped';
}
```

### 5.3 New Files to Create

| File Path | Purpose |
|-----------|---------|
| `lib/types.ts` | Add Reminder and ReminderCompletion interfaces |
| `lib/utils/reminder-utils.ts` | Recurrence calculation logic |
| `components/reminders/reminder-card.tsx` | Individual reminder display component |
| `components/reminders/reminders-section.tsx` | Container for reminders list with header |
| `components/reminders/add-reminder-modal.tsx` | Create new reminder dialog |
| `components/reminders/edit-reminder-modal.tsx` | Edit existing reminder dialog |
| `scripts/00X_create_reminders.sql` | Database migration script |

### 5.4 Files to Modify

| File Path | Changes Required |
|-----------|------------------|
| `app/dashboard/page.tsx` | Fetch reminders and completions alongside tasks |
| `components/dashboard/dashboard-client.tsx` | Add reminders state, handlers, pass to TodayView |
| `components/today/today-view.tsx` | Add RemindersSection, implement responsive layout |
| `lib/utils/streak-tracking.ts` | Include reminder completions in streak logic |
| `app/api/streak/route.ts` | Update to check both tasks and reminders |

### 5.5 Key Utility Functions

Create in `lib/utils/reminder-utils.ts`:

```typescript
import { Reminder, ReminderCompletion, ReminderWithStatus } from '@/lib/types';
import { getTodayLocal, parseDateLocal } from './date-utils';

/**
 * Check if a reminder is scheduled for a given date
 */
export function isReminderScheduledForDate(
  reminder: Reminder,
  dateStr: string
): boolean {
  if (!reminder.is_active) return false;
  
  const date = parseDateLocal(dateStr);
  const createdDate = parseDateLocal(reminder.created_at.split('T')[0]);
  
  // Don't show reminders for dates before they were created
  if (date < createdDate) return false;
  
  switch (reminder.recurrence_type) {
    case 'daily':
      return isDailyMatch(reminder, createdDate, date);
    case 'weekly':
      return isWeeklyMatch(reminder, createdDate, date);
    case 'monthly':
      return isMonthlyMatch(reminder, date);
    default:
      return false;
  }
}

/**
 * Check if date matches daily recurrence pattern
 */
function isDailyMatch(reminder: Reminder, startDate: Date, targetDate: Date): boolean {
  const daysDiff = Math.floor(
    (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysDiff >= 0 && daysDiff % reminder.recurrence_interval === 0;
}

/**
 * Check if date matches weekly recurrence pattern
 */
function isWeeklyMatch(reminder: Reminder, startDate: Date, targetDate: Date): boolean {
  if (!reminder.recurrence_days || reminder.recurrence_days.length === 0) {
    return false;
  }
  
  const dayOfWeek = targetDate.getDay();
  if (!reminder.recurrence_days.includes(dayOfWeek)) {
    return false;
  }
  
  // Check week interval
  const weeksDiff = Math.floor(
    (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );
  return weeksDiff >= 0 && weeksDiff % reminder.recurrence_interval === 0;
}

/**
 * Check if date matches monthly recurrence pattern
 */
function isMonthlyMatch(reminder: Reminder, targetDate: Date): boolean {
  if (reminder.monthly_type === 'day_of_month') {
    // Check if recurrence_days contains the day of month
    const dayOfMonth = targetDate.getDate();
    return reminder.recurrence_days?.includes(dayOfMonth) ?? false;
  }
  
  if (reminder.monthly_type === 'nth_weekday') {
    const dayOfWeek = targetDate.getDay();
    const dayOfMonth = targetDate.getDate();
    
    // Check if correct day of week
    if (!reminder.recurrence_days?.includes(dayOfWeek)) {
      return false;
    }
    
    // Calculate which week position this is
    const weekPosition = Math.ceil(dayOfMonth / 7);
    
    // Handle "last" weekday (-1)
    if (reminder.monthly_week_position === -1) {
      const lastDayOfMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0
      ).getDate();
      const daysRemaining = lastDayOfMonth - dayOfMonth;
      return daysRemaining < 7; // Is this the last occurrence of this weekday?
    }
    
    return weekPosition === reminder.monthly_week_position;
  }
  
  return false;
}

/**
 * Get all reminders scheduled for today with their completion status
 */
export function getTodaysReminders(
  reminders: Reminder[],
  completions: ReminderCompletion[]
): ReminderWithStatus[] {
  const today = getTodayLocal();
  const todayCompletions = completions.filter(c => c.completion_date === today);
  
  return reminders
    .filter(r => isReminderScheduledForDate(r, today))
    .map(reminder => {
      const completion = todayCompletions.find(c => c.reminder_id === reminder.id);
      return {
        ...reminder,
        todayStatus: completion?.status ?? 'incomplete',
      };
    });
}

/**
 * Get human-readable recurrence label
 */
export function getRecurrenceLabel(reminder: Reminder): string {
  const interval = reminder.recurrence_interval;
  
  switch (reminder.recurrence_type) {
    case 'daily':
      return interval === 1 ? 'Daily' : `Every ${interval} days`;
      
    case 'weekly':
      const days = reminder.recurrence_days?.map(d => 
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]
      ).join(', ');
      const weekPrefix = interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      return `${weekPrefix} on ${days}`;
      
    case 'monthly':
      const monthPrefix = interval === 1 ? 'Monthly' : `Every ${interval} months`;
      if (reminder.monthly_type === 'day_of_month') {
        const day = reminder.recurrence_days?.[0];
        return `${monthPrefix} on day ${day}`;
      }
      if (reminder.monthly_type === 'nth_weekday') {
        const position = reminder.monthly_week_position === -1 
          ? 'last' 
          : ['first', 'second', 'third', 'fourth'][reminder.monthly_week_position! - 1];
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][reminder.recurrence_days?.[0] ?? 0];
        return `${monthPrefix} on the ${position} ${dayName}`;
      }
      return monthPrefix;
      
    default:
      return 'Unknown';
  }
}

/**
 * Format time label for display
 */
export function formatTimeLabel(timeLabel: string | null): string | null {
  if (!timeLabel) return null;
  
  // Parse "HH:MM:SS" format
  const [hours, minutes] = timeLabel.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
```

### 5.6 Updated Streak Logic

Modify `lib/utils/streak-tracking.ts`:

```typescript
// Add to existing updateStreak function or create new helper

export async function hasCompletedAnythingToday(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const today = getTodayLocal();
  
  // Check for completed tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('completed', true)
    .eq('start_date', today)
    .limit(1);
  
  if (tasks && tasks.length > 0) return true;
  
  // Check for completed reminders (not skipped)
  const { data: completions } = await supabase
    .from('reminder_completions')
    .select('id, reminders!inner(user_id)')
    .eq('reminders.user_id', userId)
    .eq('completion_date', today)
    .eq('status', 'completed')
    .limit(1);
  
  return completions && completions.length > 0;
}
```

---

## 6. Testing Requirements

### 6.1 Unit Tests

1. Recurrence calculation for daily patterns with various intervals
2. Recurrence calculation for weekly patterns with multiple days selected
3. Recurrence calculation for monthly "day of month" patterns
4. Recurrence calculation for monthly "nth weekday" patterns
5. Edge cases: month boundaries, leap years, "last Friday" of month
6. Streak logic with mixed task/reminder completions
7. `formatTimeLabel` function
8. `getRecurrenceLabel` function

### 6.2 Integration Tests

1. Create/read/update/delete reminders via Supabase
2. Completion tracking persists correctly
3. RLS policies enforce user isolation
4. Unique constraint on (reminder_id, completion_date) works correctly

### 6.3 E2E Tests

1. Full flow: create reminder → see on Today → complete → verify streak
2. Edit reminder and verify changes persist
3. Skip reminder and verify state
4. Undo skip and verify state change
5. Delete reminder
6. Responsive layout on mobile vs desktop
7. Verify reminders don't appear on non-scheduled days

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| Adoption | 30% of active users create at least 1 reminder within 30 days of launch |
| Engagement | Users with reminders have 20% higher streak retention |
| Completion Rate | Average reminder completion rate > 70% |

---

## 8. Open Questions

1. Should we show reminder completion history/stats in a dedicated view?
2. Should reminders have an optional notes/description field?
3. How should we handle timezone changes for users who travel?

---

## 9. Future Considerations (Post-v1)

- Push notifications at specified time
- Vacation/pause mode
- Reminder categories with color coding
- Habit analytics dashboard (completion rates over time)
- Import reminders from calendar apps
- Reminder sharing/templates

---

## Appendix A: Component Hierarchy

```
app/dashboard/page.tsx
└── DashboardClient
    └── TodayView
        ├── RemindersSection (new)
        │   ├── ReminderCard (new) × N
        │   └── AddReminderModal (new)
        └── TasksSection (existing, renamed)
            └── TaskCard × N
```

## Appendix B: State Flow

```
User clicks "+" on Reminders
    → AddReminderModal opens
    → User fills form, clicks Save
    → INSERT into reminders table
    → Refresh reminders state
    → Modal closes
    → New reminder appears in list

User checks reminder checkbox
    → INSERT into reminder_completions (status: 'completed')
    → Update local state to show completed
    → Call /api/streak to update streak

User clicks "Skip Today"
    → INSERT into reminder_completions (status: 'skipped')
    → Update local state to show skipped
    → Streak NOT updated
```

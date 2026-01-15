# Product Requirements Document: Daily Recalibration Feature for Friday

**Version:** 1.0  
**Date:** January 14, 2026  
**Status:** Draft  

---

## 1. Overview

### 1.1 Problem Statement

Friday users frequently fall behind on tasks, causing due dates to become stale. When a user doesn't complete all planned tasks, they must manually navigate to the Schedule page and edit each task individually to update due dates, importance, and urgency. This process is:

- **Time-consuming:** Each task requires opening an edit dialog, changing values, and saving
- **Repetitive:** Users often just need to push tasks back 1-2 days
- **Error-prone:** Manual updates can lead to inconsistent prioritization
- **Demotivating:** Seeing overdue tasks without a quick path to resolution creates cognitive load

The result is that users either spend significant time on "task admin" or let their task list become stale, undermining the Eisenhower Matrix prioritization that makes Friday valuable.

### 1.2 Proposed Solution

Introduce a **Daily Recalibration** modal that appears near the end of the day (configurable, default 5:00 PM) when users have tasks requiring attention. This modal provides a streamlined interface to quickly review and adjust upcoming tasks without navigating away from the Today screen.

The modal surfaces:
- **Overdue tasks:** Tasks with `due_date` before today
- **Due today (incomplete):** Tasks due today that aren't done
- **Due tomorrow:** Tasks due the next day (optional preview for planning)

Users can quickly adjust due dates using preset buttons ("Tomorrow", "+2 Days", "Next Week"), update importance/urgency with single taps, or mark tasks as complete—all without opening individual edit dialogs.

### 1.3 Goals

1. **Reduce friction:** Make daily task maintenance take < 2 minutes instead of 10+ minutes
2. **Improve accuracy:** Ensure task due dates and priorities reflect current reality
3. **Maintain engagement:** Prevent users from abandoning the app due to "admin fatigue"
4. **Preserve focus:** Keep users on the Today screen; don't require navigation to Schedule

### 1.4 Non-Goals (v1)

- Bulk selection / "apply to all" functionality (future enhancement)
- AI-powered suggestions for new due dates
- Integration with calendar apps for automatic rescheduling
- Custom recurrence patterns (one-time adjustments only)
- Snooze/defer without setting new due date

---

## 2. User Stories

### 2.1 Core User Stories

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| US-1 | As a user, I want to be prompted to review overdue tasks at the end of my day so I can start tomorrow with an accurate task list. | Modal appears automatically based on trigger conditions |
| US-2 | As a user, I want to quickly push a task's due date forward using preset options so I don't have to use a date picker. | "Tomorrow", "+2 Days", "+1 Week" buttons available |
| US-3 | As a user, I want to update a task's importance and urgency during recalibration so my priorities are current. | Toggle buttons for importance/urgency on each task card |
| US-4 | As a user, I want to mark a task as complete during recalibration so I can clear it without going to the full edit view. | Checkbox completes task and removes from recalibration list |
| US-5 | As a user, I want to skip recalibration for today so I'm not blocked when I'm in a hurry. | "Skip Today" button dismisses modal until tomorrow |
| US-6 | As a user, I want to snooze the recalibration prompt so I can finish what I'm doing first. | "Remind me in 1 hour" option available |
| US-7 | As a user, I want to manually trigger recalibration so I can review tasks at any time. | Access via header menu or settings |
| US-8 | As a user, I want to configure when the recalibration prompt appears so it fits my schedule. | Time setting in user preferences |

---

## 3. Functional Requirements

### 3.1 Trigger Logic

The Daily Recalibration modal should appear when ALL of the following conditions are met:

| Condition | Description |
|-----------|-------------|
| **Time threshold met** | Current local time ≥ user's configured trigger time (default: 5:00 PM / 17:00) |
| **Tasks need attention** | At least 1 task meets recalibration criteria (see §3.2) |
| **Not already dismissed today** | User hasn't clicked "Skip Today" for the current date |
| **Not snoozed** | If snoozed, snooze period has elapsed |
| **User is active** | User navigates to or is viewing the Today screen |

**Important:** The modal should NOT interrupt task completion flows. It should appear:
- On initial page load (after data fetch completes)
- When returning to the Today tab from Schedule
- NOT immediately after completing a task (give 3-second delay)

### 3.2 Task Selection Criteria

Tasks are included in recalibration if they meet ANY of these criteria:

| Category | Criteria | Display Priority |
|----------|----------|------------------|
| **Overdue** | `due_date < today` AND `completed = false` | 1 (highest) |
| **Due Today** | `due_date = today` AND `completed = false` | 2 |
| **Due Tomorrow** | `due_date = today + 1` AND `completed = false` | 3 (optional, shown in collapsed section) |

**Exclusions:**
- Completed tasks (`completed = true`)
- Recurring task instances beyond the first incomplete one in a series

### 3.3 User Preference: Recalibration Settings

Add to Profile/Settings:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `recalibration_enabled` | boolean | `true` | Master toggle for auto-prompt |
| `recalibration_time` | time | `17:00` | Local time to trigger prompt |
| `recalibration_include_tomorrow` | boolean | `true` | Include tomorrow's tasks in review |

### 3.4 Recalibration Session State

Track the current session state (not persisted to database—stored in localStorage):

| Field | Type | Description |
|-------|------|-------------|
| `last_dismissed_date` | date string | Date when user clicked "Skip Today" |
| `snoozed_until` | ISO timestamp | If snoozed, when to show again |

### 3.5 Task Updates During Recalibration

When a user makes changes in the recalibration modal:

| Action | Database Update | Side Effects |
|--------|-----------------|--------------|
| Change due date | `UPDATE tasks SET due_date = ?, start_date = ?, updated_at = NOW()` | Re-run `assignStartDates()` algorithm |
| Change importance | `UPDATE tasks SET importance = ?, updated_at = NOW()` | Re-run `assignStartDates()` algorithm |
| Change urgency | `UPDATE tasks SET urgency = ?, updated_at = NOW()` | Re-run `assignStartDates()` algorithm |
| Mark complete | Same as existing task completion flow | Update streak, generate recurring instance if applicable |
| Remove from list | No database change | Task hidden in current session only; will reappear if modal reopens |

**Important:** Changes should be batched and saved when user clicks "Done" or closes the modal—not on every individual action. This prevents excessive database calls and allows users to undo changes before committing.

---

## 4. UI/UX Requirements

### 4.1 Modal Layout

The Daily Recalibration modal uses a card-based interface optimized for quick scanning and rapid updates.

#### 4.1.1 Mobile Layout (< 768px)

Full-screen modal with vertically stacked task cards:

```
┌─────────────────────────────────────────┐
│ ╳                                       │
│                                         │
│  🌅 Daily Recalibration                 │
│  Review your upcoming tasks             │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ⚠️ OVERDUE (3)                      ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ○ Finish Q4 report                  ││
│  │   📅 Was due: Jan 12 (2 days ago)   ││
│  │                                     ││
│  │   [Tomorrow] [+2 Days] [+1 Week] [📅]││
│  │                                     ││
│  │   Important? [Yes] [No]             ││
│  │   Urgent?    [Yes] [No]             ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ○ Call dentist                      ││
│  │   📅 Was due: Jan 13 (1 day ago)    ││
│  │   ...                               ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 📋 DUE TODAY (2)                    ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ○ Review PR #234                    ││
│  │   📅 Due: Today                     ││
│  │   ...                               ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 📆 Tomorrow (4) ▼                   ││  ← Collapsed by default
│  └─────────────────────────────────────┘│
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [Skip Today]           [Done ✓]        │
│                                         │
│  ⏰ Remind me in 1 hour                 │
│                                         │
└─────────────────────────────────────────┘
```

#### 4.1.2 Desktop Layout (≥ 768px)

Centered modal (max-width: 600px) with same card structure:

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│        ┌────────────────────────────────────────────────┐        │
│        │ 🌅 Daily Recalibration                      ╳  │        │
│        │ Review and adjust your upcoming tasks          │        │
│        │                                                │        │
│        │ ┌────────────────────────────────────────────┐ │        │
│        │ │ ⚠️ OVERDUE (3)                             │ │        │
│        │ ├────────────────────────────────────────────┤ │        │
│        │ │ ○ Finish Q4 report                         │ │        │
│        │ │   📅 Was due: Jan 12 (2 days ago)          │ │        │
│        │ │                                            │ │        │
│        │ │   [Tomorrow] [+2 Days] [+1 Week] [📅]      │ │        │
│        │ │                                            │ │        │
│        │ │   Important? [Yes] [No]  Urgent? [Yes] [No]│ │        │
│        │ ├────────────────────────────────────────────┤ │        │
│        │ │ ○ Call dentist                             │ │        │
│        │ │   📅 Was due: Jan 13 (1 day ago)           │ │        │
│        │ │   ...                                      │ │        │
│        │ └────────────────────────────────────────────┘ │        │
│        │                                                │        │
│        │ ┌────────────────────────────────────────────┐ │        │
│        │ │ 📋 DUE TODAY (2)                           │ │        │
│        │ │ ...                                        │ │        │
│        │ └────────────────────────────────────────────┘ │        │
│        │                                                │        │
│        │     [Skip Today]              [Done ✓]         │        │
│        │             ⏰ Remind me in 1 hour             │        │
│        │                                                │        │
│        └────────────────────────────────────────────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Task Card Component

Each task in the recalibration list is displayed as an interactive card:

```
┌─────────────────────────────────────────────────────────┐
│ ○ Task Title Here                                    ⋮  │
│   📅 Was due: Jan 12 (2 days ago)                       │
│   🏷️ Work • 2h estimated                                │
│                                                         │
│   New due date:                                         │
│   [Tomorrow] [+2 Days] [+1 Week] [📅 Pick date]         │
│                                                         │
│   ┌─────────────────┐  ┌─────────────────┐             │
│   │ Important?      │  │ Urgent?         │             │
│   │ (●) Yes  ○ No   │  │ (●) Yes  ○ No   │             │
│   └─────────────────┘  └─────────────────┘             │
│                                                         │
│   Current: Critical (Do First)                          │
└─────────────────────────────────────────────────────────┘
```

**Card Elements:**

| Element | Description |
|---------|-------------|
| Checkbox | Circular checkbox to mark complete (same style as TaskCard) |
| Title | Task title, truncated with ellipsis if too long |
| Overflow menu (⋮) | "Remove from review" option (hides task from current session) |
| Due date context | Shows original due date + relative time ("2 days ago") |
| Category + estimate | Shows category badge and estimated hours |
| Quick date buttons | Preset options: Tomorrow, +2 Days, +1 Week, Custom picker |
| Importance toggle | Radio-style buttons: Yes / No (pre-selected based on current value) |
| Urgency toggle | Radio-style buttons: Yes / No (pre-selected based on current value) |
| Quadrant preview | Shows resulting Eisenhower quadrant based on current selections |

### 4.3 Visual States

| State | Visual Treatment |
|-------|------------------|
| **Unchanged** | Default card styling |
| **Modified** | Subtle highlight border (e.g., blue-200), "unsaved" indicator dot |
| **Completed** | Checkbox filled, card fades out and collapses after 500ms |
| **Removed** | Card slides out to the right |

### 4.4 Progress Indicator

Show progress at the top of the modal:

```
Reviewed 3 of 7 tasks  ████████░░░░░░░░  43%
```

A task counts as "reviewed" when the user either:
- Makes any change to it, OR
- Explicitly clicks "Keep as-is" (optional button, or scrolls past without interaction)

### 4.5 Empty State

If triggered but no tasks need attention (edge case):

```
┌─────────────────────────────────────────┐
│                                         │
│  ✨ All caught up!                      │
│                                         │
│  No tasks need your attention right     │
│  now. Great job staying on top of       │
│  things!                                │
│                                         │
│           [Close]                       │
│                                         │
└─────────────────────────────────────────┘
```

### 4.6 Quadrant Label Mapping

Display user-friendly quadrant names (matching existing Friday terminology):

| Quadrant | Internal Value | Display Label |
|----------|----------------|---------------|
| Urgent + Important | `urgent-important` | **Critical** (Do First) |
| Not Urgent + Important | `not-urgent-important` | **Plan** (Schedule) |
| Urgent + Not Important | `urgent-not-important` | **Delegate** (Quick Wins) |
| Not Urgent + Not Important | `not-urgent-not-important` | **Backlog** (Consider) |

---

## 5. Technical Implementation

### 5.1 No Database Schema Changes Required

This feature uses existing tables. The recalibration session state is stored in **localStorage** (not database) since it's device-specific and ephemeral.

**localStorage Keys:**

```typescript
// Key: "friday_recalibration_state"
interface RecalibrationLocalState {
  lastDismissedDate: string | null;  // "YYYY-MM-DD" format
  snoozedUntil: string | null;       // ISO timestamp
}
```

### 5.2 Profile Schema Addition (Optional Enhancement)

If user preferences for recalibration time are desired, add to profiles table:

```sql
-- Migration: Add recalibration preferences to profiles
ALTER TABLE public.profiles 
  ADD COLUMN recalibration_enabled BOOLEAN DEFAULT true,
  ADD COLUMN recalibration_time TIME DEFAULT '17:00',
  ADD COLUMN recalibration_include_tomorrow BOOLEAN DEFAULT true;
```

**Note:** For v1, these can be hardcoded defaults. Database storage enables future Settings UI.

### 5.3 TypeScript Interfaces

Add to `lib/types.ts`:

```typescript
// Recalibration-specific types
export interface RecalibrationTask extends Task {
  daysOverdue: number;           // Negative if due in future
  originalDueDate: string;       // For display purposes
  pendingChanges: PendingTaskChanges | null;
}

export interface PendingTaskChanges {
  due_date?: string;
  importance?: 'important' | 'not-important';
  urgency?: 'urgent' | 'not-urgent';
  completed?: boolean;
}

export interface RecalibrationState {
  isOpen: boolean;
  tasks: RecalibrationTask[];
  pendingChanges: Map<string, PendingTaskChanges>;  // taskId -> changes
  hiddenTaskIds: Set<string>;    // Tasks removed from current session
}

export interface RecalibrationLocalStorage {
  lastDismissedDate: string | null;
  snoozedUntil: string | null;
}

// Preset date options
export type DatePreset = 'tomorrow' | 'plus2' | 'plus7' | 'custom';
```

### 5.4 New Files to Create

| File Path | Purpose |
|-----------|---------|
| `components/recalibration/recalibration-modal.tsx` | Main modal component with state management |
| `components/recalibration/recalibration-task-card.tsx` | Individual task card for recalibration view |
| `components/recalibration/recalibration-section.tsx` | Section wrapper (Overdue, Due Today, Tomorrow) |
| `components/recalibration/date-preset-buttons.tsx` | Quick date selection button group |
| `components/recalibration/importance-urgency-toggles.tsx` | Toggle buttons for importance/urgency |
| `lib/utils/recalibration-utils.ts` | Helper functions for date calculations, filtering |
| `hooks/use-recalibration.ts` | Custom hook for recalibration state and logic |

### 5.5 Files to Modify

| File Path | Changes Required |
|-----------|------------------|
| `lib/types.ts` | Add RecalibrationTask, PendingTaskChanges, RecalibrationState interfaces |
| `components/dashboard/dashboard-client.tsx` | Add recalibration state, trigger logic, modal rendering |
| `components/today/today-view.tsx` | Pass recalibration trigger callback |
| `components/dashboard/app-header.tsx` | Add "Recalibrate" menu option for manual trigger |

### 5.6 Key Utility Functions

Create `lib/utils/recalibration-utils.ts`:

```typescript
import { Task, RecalibrationTask } from '@/lib/types';
import { getTodayLocal, addDaysToDateString, parseDateLocal, formatDateLocal } from './date-utils';

/**
 * Filter tasks that need recalibration attention
 */
export function getTasksForRecalibration(
  tasks: Task[],
  includeTomorrow: boolean = true
): { overdue: RecalibrationTask[]; dueToday: RecalibrationTask[]; dueTomorrow: RecalibrationTask[] } {
  const today = getTodayLocal();
  const tomorrow = addDaysToDateString(today, 1);
  
  const incompleteTasks = tasks.filter(t => !t.completed && t.due_date);
  
  const overdue: RecalibrationTask[] = [];
  const dueToday: RecalibrationTask[] = [];
  const dueTomorrow: RecalibrationTask[] = [];
  
  for (const task of incompleteTasks) {
    const dueDate = task.due_date!;
    const daysOverdue = calculateDaysOverdue(dueDate, today);
    
    const recalTask: RecalibrationTask = {
      ...task,
      daysOverdue,
      originalDueDate: dueDate,
      pendingChanges: null,
    };
    
    if (dueDate < today) {
      overdue.push(recalTask);
    } else if (dueDate === today) {
      dueToday.push(recalTask);
    } else if (dueDate === tomorrow && includeTomorrow) {
      dueTomorrow.push(recalTask);
    }
  }
  
  // Sort overdue by most overdue first
  overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
  
  return { overdue, dueToday, dueTomorrow };
}

/**
 * Calculate days overdue (positive = overdue, negative = due in future)
 */
function calculateDaysOverdue(dueDate: string, today: string): number {
  const due = parseDateLocal(dueDate);
  const todayDate = parseDateLocal(today);
  const diffMs = todayDate.getTime() - due.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if recalibration modal should be shown
 */
export function shouldShowRecalibration(
  tasks: Task[],
  triggerHour: number = 17,  // 5 PM default
  localState: RecalibrationLocalStorage | null
): boolean {
  const today = getTodayLocal();
  const now = new Date();
  const currentHour = now.getHours();
  
  // Check time threshold
  if (currentHour < triggerHour) {
    return false;
  }
  
  // Check if dismissed today
  if (localState?.lastDismissedDate === today) {
    return false;
  }
  
  // Check if snoozed
  if (localState?.snoozedUntil) {
    const snoozeEnd = new Date(localState.snoozedUntil);
    if (now < snoozeEnd) {
      return false;
    }
  }
  
  // Check if any tasks need attention
  const { overdue, dueToday } = getTasksForRecalibration(tasks, false);
  return overdue.length > 0 || dueToday.length > 0;
}

/**
 * Calculate new due date from preset
 */
export function calculatePresetDate(preset: DatePreset): string {
  const today = getTodayLocal();
  
  switch (preset) {
    case 'tomorrow':
      return addDaysToDateString(today, 1);
    case 'plus2':
      return addDaysToDateString(today, 2);
    case 'plus7':
      return addDaysToDateString(today, 7);
    default:
      return today;
  }
}

/**
 * Get human-readable relative date string
 */
export function getRelativeDateString(dueDate: string): string {
  const today = getTodayLocal();
  const daysOverdue = calculateDaysOverdue(dueDate, today);
  
  if (daysOverdue === 0) {
    return 'Today';
  } else if (daysOverdue === 1) {
    return '1 day ago';
  } else if (daysOverdue > 1) {
    return `${daysOverdue} days ago`;
  } else if (daysOverdue === -1) {
    return 'Tomorrow';
  } else {
    return `In ${Math.abs(daysOverdue)} days`;
  }
}

/**
 * Get snooze end time (1 hour from now)
 */
export function getSnoozeEndTime(): string {
  const snoozeEnd = new Date();
  snoozeEnd.setHours(snoozeEnd.getHours() + 1);
  return snoozeEnd.toISOString();
}
```

### 5.7 Custom Hook

Create `hooks/use-recalibration.ts`:

```typescript
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, RecalibrationTask, PendingTaskChanges, RecalibrationLocalStorage } from '@/lib/types';
import { 
  getTasksForRecalibration, 
  shouldShowRecalibration, 
  getSnoozeEndTime 
} from '@/lib/utils/recalibration-utils';
import { getTodayLocal } from '@/lib/utils/date-utils';

const STORAGE_KEY = 'friday_recalibration_state';

function getLocalState(): RecalibrationLocalStorage | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

function setLocalState(state: RecalibrationLocalStorage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useRecalibration(tasks: Task[], triggerHour: number = 17) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingTaskChanges>>(new Map());
  const [hiddenTaskIds, setHiddenTaskIds] = useState<Set<string>>(new Set());
  const [hasCheckedTrigger, setHasCheckedTrigger] = useState(false);
  
  // Get categorized tasks
  const { overdue, dueToday, dueTomorrow } = useMemo(
    () => getTasksForRecalibration(tasks, true),
    [tasks]
  );
  
  // Filter out hidden tasks
  const visibleTasks = useMemo(() => ({
    overdue: overdue.filter(t => !hiddenTaskIds.has(t.id)),
    dueToday: dueToday.filter(t => !hiddenTaskIds.has(t.id)),
    dueTomorrow: dueTomorrow.filter(t => !hiddenTaskIds.has(t.id)),
  }), [overdue, dueToday, dueTomorrow, hiddenTaskIds]);
  
  const totalTaskCount = visibleTasks.overdue.length + 
                         visibleTasks.dueToday.length + 
                         visibleTasks.dueTomorrow.length;
  
  // Check if should auto-trigger
  useEffect(() => {
    if (hasCheckedTrigger) return;
    
    const localState = getLocalState();
    if (shouldShowRecalibration(tasks, triggerHour, localState)) {
      // Delay slightly to not interrupt page load
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
    setHasCheckedTrigger(true);
  }, [tasks, triggerHour, hasCheckedTrigger]);
  
  // Update pending changes for a task
  const updateTaskChanges = useCallback((taskId: string, changes: Partial<PendingTaskChanges>) => {
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(taskId) || {};
      newMap.set(taskId, { ...existing, ...changes });
      return newMap;
    });
  }, []);
  
  // Hide task from current session
  const hideTask = useCallback((taskId: string) => {
    setHiddenTaskIds(prev => new Set(prev).add(taskId));
  }, []);
  
  // Skip for today
  const skipToday = useCallback(() => {
    setLocalState({
      lastDismissedDate: getTodayLocal(),
      snoozedUntil: null,
    });
    setIsOpen(false);
    resetState();
  }, []);
  
  // Snooze for 1 hour
  const snooze = useCallback(() => {
    const localState = getLocalState();
    setLocalState({
      lastDismissedDate: localState?.lastDismissedDate || null,
      snoozedUntil: getSnoozeEndTime(),
    });
    setIsOpen(false);
  }, []);
  
  // Reset state (for reuse)
  const resetState = useCallback(() => {
    setPendingChanges(new Map());
    setHiddenTaskIds(new Set());
  }, []);
  
  // Open modal manually
  const openManually = useCallback(() => {
    setIsOpen(true);
  }, []);
  
  // Close modal
  const close = useCallback(() => {
    setIsOpen(false);
    resetState();
  }, [resetState]);
  
  // Get all pending changes for submission
  const getAllPendingChanges = useCallback(() => {
    return Array.from(pendingChanges.entries()).map(([taskId, changes]) => ({
      taskId,
      changes,
    }));
  }, [pendingChanges]);
  
  return {
    isOpen,
    setIsOpen,
    visibleTasks,
    totalTaskCount,
    pendingChanges,
    updateTaskChanges,
    hideTask,
    skipToday,
    snooze,
    close,
    openManually,
    getAllPendingChanges,
    hasChanges: pendingChanges.size > 0,
  };
}
```

### 5.8 Component Structure

#### Main Modal Component (`recalibration-modal.tsx`):

```typescript
'use client';

import { useState } from 'react';
import { Task, Profile, PendingTaskChanges } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RecalibrationSection } from './recalibration-section';
import { RecalibrationTaskCard } from './recalibration-task-card';
import { useRecalibration } from '@/hooks/use-recalibration';
import { Sunrise, Clock } from 'lucide-react';

interface RecalibrationModalProps {
  tasks: Task[];
  profile: Profile;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveChanges: (changes: Array<{ taskId: string; changes: PendingTaskChanges }>) => Promise<void>;
  onTaskComplete: (taskId: string) => void;
  onSkipToday: () => void;
  onSnooze: () => void;
}

export function RecalibrationModal({
  tasks,
  profile,
  isOpen,
  onOpenChange,
  onSaveChanges,
  onTaskComplete,
  onSkipToday,
  onSnooze,
}: RecalibrationModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const {
    visibleTasks,
    totalTaskCount,
    pendingChanges,
    updateTaskChanges,
    hideTask,
    hasChanges,
    getAllPendingChanges,
  } = useRecalibration(tasks);
  
  const handleDone = async () => {
    if (hasChanges) {
      setIsSaving(true);
      try {
        await onSaveChanges(getAllPendingChanges());
      } finally {
        setIsSaving(false);
      }
    }
    onOpenChange(false);
  };
  
  const reviewedCount = pendingChanges.size;
  const progressPercent = totalTaskCount > 0 
    ? Math.round((reviewedCount / totalTaskCount) * 100) 
    : 100;
  
  // Empty state
  if (totalTaskCount === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="dialog-sheet max-w-lg">
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✨</div>
            <h2 className="text-xl font-semibold mb-2">All caught up!</h2>
            <p className="text-muted-foreground mb-6">
              No tasks need your attention right now. Great job staying on top of things!
            </p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-sheet max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sunrise className="h-5 w-5 text-amber-500" />
            Daily Recalibration
          </DialogTitle>
          <DialogDescription>
            Review and adjust your upcoming tasks
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Reviewed {reviewedCount} of {totalTaskCount} tasks</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        
        {/* Scrollable task list */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {visibleTasks.overdue.length > 0 && (
            <RecalibrationSection 
              title="Overdue" 
              count={visibleTasks.overdue.length}
              variant="warning"
            >
              {visibleTasks.overdue.map(task => (
                <RecalibrationTaskCard
                  key={task.id}
                  task={task}
                  pendingChanges={pendingChanges.get(task.id)}
                  onUpdateChanges={(changes) => updateTaskChanges(task.id, changes)}
                  onComplete={() => onTaskComplete(task.id)}
                  onHide={() => hideTask(task.id)}
                />
              ))}
            </RecalibrationSection>
          )}
          
          {visibleTasks.dueToday.length > 0 && (
            <RecalibrationSection 
              title="Due Today" 
              count={visibleTasks.dueToday.length}
              variant="default"
            >
              {visibleTasks.dueToday.map(task => (
                <RecalibrationTaskCard
                  key={task.id}
                  task={task}
                  pendingChanges={pendingChanges.get(task.id)}
                  onUpdateChanges={(changes) => updateTaskChanges(task.id, changes)}
                  onComplete={() => onTaskComplete(task.id)}
                  onHide={() => hideTask(task.id)}
                />
              ))}
            </RecalibrationSection>
          )}
          
          {visibleTasks.dueTomorrow.length > 0 && (
            <RecalibrationSection 
              title="Tomorrow" 
              count={visibleTasks.dueTomorrow.length}
              variant="muted"
              defaultCollapsed
            >
              {visibleTasks.dueTomorrow.map(task => (
                <RecalibrationTaskCard
                  key={task.id}
                  task={task}
                  pendingChanges={pendingChanges.get(task.id)}
                  onUpdateChanges={(changes) => updateTaskChanges(task.id, changes)}
                  onComplete={() => onTaskComplete(task.id)}
                  onHide={() => hideTask(task.id)}
                />
              ))}
            </RecalibrationSection>
          )}
        </div>
        
        {/* Footer actions */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onSkipToday}
            >
              Skip Today
            </Button>
            <Button 
              className="flex-1"
              onClick={handleDone}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Done ✓'}
            </Button>
          </div>
          
          <button
            onClick={onSnooze}
            className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
          >
            <Clock className="h-3 w-3" />
            Remind me in 1 hour
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 5.9 Integration with DashboardClient

Add to `components/dashboard/dashboard-client.tsx`:

```typescript
// Add import
import { RecalibrationModal } from '@/components/recalibration/recalibration-modal';
import { useRecalibration } from '@/hooks/use-recalibration';

// Inside DashboardClient component, add state and handlers:

const {
  isOpen: isRecalibrationOpen,
  setIsOpen: setRecalibrationOpen,
  skipToday: skipRecalibrationToday,
  snooze: snoozeRecalibration,
  openManually: openRecalibrationManually,
} = useRecalibration(tasks);

const handleRecalibrationSave = async (
  changes: Array<{ taskId: string; changes: PendingTaskChanges }>
) => {
  // Batch update tasks
  const updates = changes.map(({ taskId, changes }) => 
    supabase
      .from('tasks')
      .update({
        ...(changes.due_date && { due_date: changes.due_date, start_date: changes.due_date }),
        ...(changes.importance && { importance: changes.importance }),
        ...(changes.urgency && { urgency: changes.urgency }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
  );
  
  await Promise.all(updates);
  
  // Refresh task list and re-run scheduling
  router.refresh();
  
  toast({
    title: 'Tasks Updated',
    description: `${changes.length} task${changes.length > 1 ? 's' : ''} recalibrated successfully.`,
  });
};

// Add modal to render:
return (
  <>
    {/* Existing components */}
    
    <RecalibrationModal
      tasks={tasks}
      profile={profile}
      isOpen={isRecalibrationOpen}
      onOpenChange={setRecalibrationOpen}
      onSaveChanges={handleRecalibrationSave}
      onTaskComplete={handleTaskComplete}
      onSkipToday={skipRecalibrationToday}
      onSnooze={snoozeRecalibration}
    />
  </>
);
```

---

## 6. Interaction Flows

### 6.1 Auto-Trigger Flow

```
User opens Friday app at 5:30 PM
    → Dashboard loads, tasks fetched
    → useRecalibration hook checks:
        ✓ Time ≥ 17:00
        ✓ Not dismissed today
        ✓ Not snoozed
        ✓ 3 overdue tasks exist
    → After 1s delay, RecalibrationModal opens
    → User reviews tasks, updates due dates
    → User clicks "Done"
    → Changes batch-saved to database
    → assignStartDates() re-runs
    → Toast confirms success
    → Modal closes
```

### 6.2 Skip Flow

```
User sees RecalibrationModal
    → User clicks "Skip Today"
    → localStorage updated: lastDismissedDate = today
    → Modal closes
    → Modal won't auto-trigger again today
    → User can still manually trigger via header menu
```

### 6.3 Snooze Flow

```
User sees RecalibrationModal
    → User clicks "Remind me in 1 hour"
    → localStorage updated: snoozedUntil = now + 1 hour
    → Modal closes
    → User continues using app
    → 1 hour later, user navigates to Today
    → Hook checks: snooze expired
    → Modal auto-triggers again
```

### 6.4 Manual Trigger Flow

```
User clicks header menu → "Recalibrate Tasks"
    → openRecalibrationManually() called
    → Modal opens regardless of time/dismissed state
    → Same flow as auto-trigger from here
```

---

## 7. Testing Requirements

### 7.1 Unit Tests

| Test Case | Description |
|-----------|-------------|
| `getTasksForRecalibration` filters correctly | Given tasks with various due dates, returns correct categorization |
| `shouldShowRecalibration` respects time threshold | Returns false before trigger hour, true after |
| `shouldShowRecalibration` respects dismissed state | Returns false if dismissed today |
| `shouldShowRecalibration` respects snooze | Returns false during snooze, true after |
| `calculatePresetDate` returns correct dates | Tomorrow, +2, +7 calculate correctly |
| `getRelativeDateString` formats correctly | "1 day ago", "2 days ago", "Tomorrow" etc. |

### 7.2 Integration Tests

| Test Case | Description |
|-----------|-------------|
| Changes persist to database | Update due_date/importance/urgency, verify saved |
| Batch updates work correctly | Multiple task changes save in single operation |
| Task completion works | Marking complete in modal updates task, triggers streak |
| localStorage state persists | Skip/snooze state survives page refresh |

### 7.3 E2E Tests

| Test Case | Description |
|-----------|-------------|
| Full flow: auto-trigger → review → save | Modal appears, user updates 3 tasks, saves, toast appears |
| Skip today prevents re-trigger | Skip, refresh page, modal doesn't appear |
| Snooze delays re-trigger | Snooze, wait 1 hour (mocked), modal appears |
| Manual trigger works anytime | Open via menu regardless of time/dismissed |
| Empty state displays correctly | No overdue tasks, shows celebration message |
| Mobile responsiveness | Modal displays correctly on mobile viewport |

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Adoption** | 50% of daily active users interact with recalibration within 2 weeks | Track modal opens / unique users |
| **Completion Rate** | 70% of recalibration sessions end with "Done" (not skip/snooze) | Track Done clicks / modal opens |
| **Time Efficiency** | Average recalibration session < 90 seconds | Track session duration |
| **Task Accuracy** | 30% reduction in overdue task count | Compare overdue tasks before/after feature launch |
| **Engagement** | Users with recalibration have 15% higher streak retention | Compare streaks between user cohorts |

---

## 9. Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | All buttons/toggles focusable with Tab, activatable with Enter/Space |
| Screen reader support | Proper ARIA labels on sections, progress bar, toggle states |
| Focus management | Focus trapped in modal, returns to trigger on close |
| Color contrast | All text meets WCAG AA contrast requirements |
| Reduced motion | Respect `prefers-reduced-motion` for animations |

---

## 10. Open Questions

1. Should the "Tomorrow" section be opt-in via settings, or always shown?
2. Should we track which tasks users most frequently reschedule (for future AI suggestions)?
3. Should there be a "bulk reschedule" option (e.g., "Push all overdue to tomorrow")?
4. Should completed tasks during recalibration show a mini celebration animation?

---

## 11. Future Considerations (Post-v1)

- **AI-powered suggestions:** "Based on your patterns, I suggest moving this to Thursday"
- **Bulk operations:** "Select all" → "Move to tomorrow"
- **Recurring task awareness:** Special handling for recurring tasks in recalibration
- **Calendar integration:** "You have a meeting at 2pm, want to move this task to after?"
- **Weekly review mode:** Expanded view for Sunday planning
- **Notification support:** Push notification at trigger time if app not open

---

## Appendix A: Component Hierarchy

```
app/dashboard/page.tsx
└── DashboardClient
    ├── TodayView
    │   └── ... (existing)
    ├── ScheduleView
    │   └── ... (existing)
    └── RecalibrationModal (new)
        ├── DialogHeader
        ├── ProgressBar
        ├── RecalibrationSection (Overdue)
        │   └── RecalibrationTaskCard × N
        │       ├── Checkbox
        │       ├── DatePresetButtons
        │       ├── ImportanceUrgencyToggles
        │       └── OverflowMenu
        ├── RecalibrationSection (Due Today)
        │   └── RecalibrationTaskCard × N
        ├── RecalibrationSection (Tomorrow) [collapsible]
        │   └── RecalibrationTaskCard × N
        └── FooterActions
            ├── SkipButton
            ├── DoneButton
            └── SnoozeLink
```

## Appendix B: State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        App Initialization                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Check trigger conditions│
                    │ (time, dismissed, snooze)│
                    └───────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
        ┌──────────┐     ┌──────────┐     ┌──────────┐
        │ Too early │     │ Dismissed│     │ Snoozed  │
        │ (do nothing)│   │ (do nothing)│  │ (wait)   │
        └──────────┘     └──────────┘     └──────────┘
              │                 │                 │
              └─────────────────┴────────┬────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │  Conditions met?    │
                              │  + Tasks need attn? │
                              └─────────────────────┘
                                         │
                           ┌─────────────┴─────────────┐
                           │ YES                       │ NO
                           ▼                           ▼
                 ┌──────────────────┐       ┌──────────────────┐
                 │ Open Modal       │       │ Do nothing       │
                 └──────────────────┘       └──────────────────┘
                           │
         ┌─────────────────┼─────────────────────────────┐
         │                 │                             │
         ▼                 ▼                             ▼
   ┌───────────┐    ┌───────────────┐           ┌─────────────┐
   │ Skip Today│    │ Make changes  │           │ Snooze      │
   └───────────┘    │ & click Done  │           └─────────────┘
         │          └───────────────┘                   │
         │                 │                             │
         ▼                 ▼                             ▼
┌────────────────┐ ┌────────────────┐         ┌────────────────┐
│ Set dismissed  │ │ Batch save to  │         │ Set snoozedUntil│
│ date in storage│ │ database       │         │ in storage     │
└────────────────┘ └────────────────┘         └────────────────┘
         │                 │                             │
         │                 ▼                             │
         │         ┌────────────────┐                    │
         │         │ Re-run         │                    │
         │         │ assignStartDates│                   │
         │         └────────────────┘                    │
         │                 │                             │
         └────────────────►├◄────────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ Close Modal    │
                  └────────────────┘
```

## Appendix C: localStorage Schema

```typescript
// Key: "friday_recalibration_state"
{
  "lastDismissedDate": "2026-01-14",  // or null
  "snoozedUntil": "2026-01-14T19:30:00.000Z"  // or null
}
```

## Appendix D: Quick Reference for Claude Code

### Files to Create (in order):
1. `lib/types.ts` - Add interfaces (modify existing)
2. `lib/utils/recalibration-utils.ts` - Utility functions
3. `hooks/use-recalibration.ts` - Custom React hook
4. `components/recalibration/date-preset-buttons.tsx` - Date quick-select buttons
5. `components/recalibration/importance-urgency-toggles.tsx` - Toggle components
6. `components/recalibration/recalibration-task-card.tsx` - Task card for modal
7. `components/recalibration/recalibration-section.tsx` - Section wrapper
8. `components/recalibration/recalibration-modal.tsx` - Main modal component

### Files to Modify:
1. `components/dashboard/dashboard-client.tsx` - Integrate modal and handlers
2. `components/dashboard/app-header.tsx` - Add manual trigger menu item

### Key Dependencies (already installed):
- `@radix-ui/react-dialog` (via shadcn/ui)
- `lucide-react` for icons
- Existing date utilities in `lib/utils/date-utils.ts`

### Styling Notes:
- Use existing `dialog-sheet` class for mobile-friendly bottom sheet behavior
- Follow existing button/toggle patterns from `edit-task-dialog.tsx`
- Use `cn()` utility for conditional class names
- Match existing color scheme (amber for warnings, muted for secondary content)

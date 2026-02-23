# Recalibration Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the recalibration modal to reduce clutter using accordion cards, lighter section headers, simplified footer, and mobile-first layout.

**Architecture:** Modify 5 existing files + 1 type definition. No new files created. Core change is adding accordion expand/collapse behavior to task cards, removing snooze, simplifying sections, and reducing date presets to 3.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Radix UI Dialog, Lucide icons

---

### Task 1: Update DatePreset type and calculatePresetDate util

Add `plus3` to the `DatePreset` union type and update `calculatePresetDate` to handle it. Keep `plus2` for backwards compatibility but it won't be used in the UI.

**Files:**
- Modify: `lib/types.ts:135`
- Modify: `lib/utils/recalibration-utils.ts:122-134`

**Step 1: Update the DatePreset type**

In `lib/types.ts:135`, change:

```typescript
export type DatePreset = 'tomorrow' | 'plus2' | 'plus3' | 'plus7' | 'custom';
```

**Step 2: Add plus3 case to calculatePresetDate**

In `lib/utils/recalibration-utils.ts:122-134`, replace the function:

```typescript
export function calculatePresetDate(preset: DatePreset): string {
  const today = getTodayLocal();

  switch (preset) {
    case 'tomorrow':
      return addDaysToDateString(today, 1);
    case 'plus2':
      return addDaysToDateString(today, 2);
    case 'plus3':
      return addDaysToDateString(today, 3);
    case 'plus7':
      return addDaysToDateString(today, 7);
    default:
      return today;
  }
}
```

**Step 3: Verify build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 4: Commit**

```bash
git add lib/types.ts lib/utils/recalibration-utils.ts
git commit -m "feat(recalibration): add plus3 date preset"
```

---

### Task 2: Simplify DatePresetButtons component

Remove the calendar picker and reduce to 3 buttons: Tomorrow / +3 Days / +1 Week.

**Files:**
- Modify: `components/recalibration/date-preset-buttons.tsx` (full rewrite, currently 100 lines)

**Step 1: Rewrite the component**

Replace the entire contents of `components/recalibration/date-preset-buttons.tsx` with:

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { DatePreset } from '@/lib/types';
import { calculatePresetDate } from '@/lib/utils/recalibration-utils';

interface DatePresetButtonsProps {
  currentDueDate: string;
  selectedDate: string | undefined;
  onDateChange: (date: string) => void;
}

export function DatePresetButtons({
  currentDueDate,
  selectedDate,
  onDateChange,
}: DatePresetButtonsProps) {
  const handlePresetClick = (preset: DatePreset) => {
    const newDate = calculatePresetDate(preset);
    onDateChange(newDate);
  };

  const isSelected = (preset: DatePreset): boolean => {
    if (!selectedDate) return false;
    return selectedDate === calculatePresetDate(preset);
  };

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        variant={isSelected('tomorrow') ? 'default' : 'outline'}
        onClick={() => handlePresetClick('tomorrow')}
        className="text-xs h-7 flex-1"
      >
        Tomorrow
      </Button>
      <Button
        type="button"
        size="sm"
        variant={isSelected('plus3') ? 'default' : 'outline'}
        onClick={() => handlePresetClick('plus3')}
        className="text-xs h-7 flex-1"
      >
        +3 Days
      </Button>
      <Button
        type="button"
        size="sm"
        variant={isSelected('plus7') ? 'default' : 'outline'}
        onClick={() => handlePresetClick('plus7')}
        className="text-xs h-7 flex-1"
      >
        +1 Week
      </Button>
    </div>
  );
}
```

Key changes:
- Removed `Calendar`, `Popover`, `PopoverContent`, `PopoverTrigger`, `CalendarIcon` imports
- Removed `useState` import (no calendar open state needed)
- Removed `parseDateLocal` import
- Changed from `flex-wrap gap-2` to `flex gap-2` with `flex-1` on buttons (equal width, single row)
- 3 presets: tomorrow, plus3, plus7
- No calendar picker

**Step 2: Verify build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add components/recalibration/date-preset-buttons.tsx
git commit -m "refactor(recalibration): simplify date presets to 3 buttons, remove calendar picker"
```

---

### Task 3: Simplify RecalibrationSection component

Replace bordered containers and colored headers with lightweight text labels.

**Files:**
- Modify: `components/recalibration/recalibration-section.tsx` (full rewrite, currently 73 lines)

**Step 1: Rewrite the component**

Replace the entire contents of `components/recalibration/recalibration-section.tsx` with:

```tsx
'use client';

import { ReactNode, useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface RecalibrationSectionProps {
  title: string;
  count: number;
  variant: 'warning' | 'default' | 'muted';
  defaultCollapsed?: boolean;
  children: ReactNode;
}

export function RecalibrationSection({
  title,
  count,
  variant,
  defaultCollapsed = false,
  children,
}: RecalibrationSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const titleColor = variant === 'warning'
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-muted-foreground';

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 mb-2 group"
      >
        {defaultCollapsed && (
          isCollapsed
            ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className={`text-xs font-semibold uppercase tracking-wider ${titleColor}`}>
          {title}
        </span>
        <span className="text-xs text-muted-foreground">{count}</span>
      </button>
      {!isCollapsed && (
        <div className="space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
```

Key changes:
- Removed `AlertTriangle`, `Calendar`, `CalendarClock` icon imports
- Removed `cn` import (not needed)
- Removed `variantStyles` map with colored backgrounds
- No outer border container
- Section header is just uppercase text label + count
- Chevron only shown for collapsible sections (`defaultCollapsed` sections)
- Reduced spacing: `space-y-2` instead of `space-y-3`

**Step 2: Verify build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add components/recalibration/recalibration-section.tsx
git commit -m "refactor(recalibration): simplify section headers to lightweight labels"
```

---

### Task 4: Redesign RecalibrationTaskCard with accordion expand/collapse

This is the biggest change. The card needs collapsed and expanded states.

**Files:**
- Modify: `components/recalibration/recalibration-task-card.tsx` (full rewrite, currently 197 lines)

**Step 1: Rewrite the component**

Replace the entire contents of `components/recalibration/recalibration-task-card.tsx` with:

```tsx
'use client';

import { useState } from 'react';
import { RecalibrationTask, PendingTaskChanges } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MoreVertical, Clock, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { DatePresetButtons } from './date-preset-buttons';
import { ImportanceUrgencyToggles } from './importance-urgency-toggles';
import {
  getRelativeDateString,
  calculatePresetDate,
} from '@/lib/utils/recalibration-utils';

interface RecalibrationTaskCardProps {
  task: RecalibrationTask;
  pendingChanges: PendingTaskChanges | undefined;
  isReviewed: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateChanges: (changes: Partial<PendingTaskChanges>) => void;
  onComplete: () => void;
  onHide: () => void;
  onMarkReviewed: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Work: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  Home: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  Health: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
  Personal: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
};

export function RecalibrationTaskCard({
  task,
  pendingChanges,
  isReviewed,
  isExpanded,
  onToggleExpand,
  onUpdateChanges,
  onComplete,
  onHide,
  onMarkReviewed,
}: RecalibrationTaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const currentImportance = pendingChanges?.importance ?? task.importance;
  const currentUrgency = pendingChanges?.urgency ?? task.urgency;

  const hasChanges = pendingChanges && Object.keys(pendingChanges).length > 0;
  const isTaskReviewed = isReviewed || !!hasChanges;

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete();
    } finally {
      setIsCompleting(false);
    }
  };

  const handleImportanceChange = (value: 'important' | 'not-important') => {
    onUpdateChanges({ importance: value });
  };

  const handleUrgencyChange = (value: 'urgent' | 'not-urgent') => {
    onUpdateChanges({ urgency: value });
  };

  const handleDateChange = (date: string) => {
    onUpdateChanges({ due_date: date });
  };

  // Determine the date badge text
  const getDateBadge = () => {
    if (pendingChanges?.due_date) {
      // Show the new date as a friendly label
      const preset = (['tomorrow', 'plus3', 'plus7'] as const).find(
        p => calculatePresetDate(p) === pendingChanges.due_date
      );
      if (preset === 'tomorrow') return '→ Tomorrow';
      if (preset === 'plus3') return '→ +3 Days';
      if (preset === 'plus7') return '→ +1 Week';
      return '→ Rescheduled';
    }
    return getRelativeDateString(task.originalDueDate);
  };

  return (
    <div
      className={cn(
        'bg-card border rounded-lg transition-all',
        hasChanges
          ? 'border-blue-300 dark:border-blue-700'
          : 'border-border',
        isCompleting && 'opacity-50'
      )}
    >
      {/* Collapsed row - always visible, tappable to expand */}
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2.5',
          !isExpanded && 'cursor-pointer'
        )}
        onClick={isExpanded ? undefined : onToggleExpand}
        role={isExpanded ? undefined : 'button'}
        tabIndex={isExpanded ? undefined : 0}
        onKeyDown={isExpanded ? undefined : (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        }}
      >
        <Checkbox
          checked={false}
          onCheckedChange={handleComplete}
          disabled={isCompleting}
          className="h-5 w-5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-foreground truncate">
              {task.title}
            </h3>
            <span className={cn(
              'text-xs shrink-0',
              pendingChanges?.due_date
                ? 'text-blue-600 dark:text-blue-400 font-medium'
                : 'text-muted-foreground'
            )}>
              {getDateBadge()}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                CATEGORY_COLORS[task.category] || 'bg-muted text-muted-foreground'
              )}
            >
              {task.category}
            </span>
            {task.estimated_hours > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {task.estimated_hours}h
              </span>
            )}
            {hasChanges && !isExpanded && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-auto shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded controls */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Overflow menu */}
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onHide}>
                  Remove from review
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Date presets */}
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Reschedule:</div>
            <DatePresetButtons
              currentDueDate={task.due_date || task.originalDueDate}
              selectedDate={pendingChanges?.due_date}
              onDateChange={handleDateChange}
            />
          </div>

          {/* Importance/Urgency */}
          <ImportanceUrgencyToggles
            importance={currentImportance}
            urgency={currentUrgency}
            onImportanceChange={handleImportanceChange}
            onUrgencyChange={handleUrgencyChange}
            compact
          />

          {/* Keep as-is */}
          {!isTaskReviewed && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={onMarkReviewed}
            >
              <Check className="h-3 w-3 mr-1" />
              Keep as-is
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

Key changes from current:
- New props: `isExpanded` and `onToggleExpand` (accordion state managed by parent)
- Collapsed state: compact row with checkbox, title, date badge, category, estimate, blue dot
- Expanded state: reveals date presets, importance/urgency toggles, keep-as-is, overflow menu
- No `border-t` dividers between sections in expanded state
- Removed `Calendar` icon import (using `Clock` only)
- `getDateBadge()` shows the rescheduled target when date is changed
- Tapping the collapsed row expands (checkbox click stops propagation)
- Removed `formatDueDateForDisplay` import (using `getRelativeDateString` instead)

**Step 2: Verify build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors (or errors in recalibration-modal.tsx since it needs to pass the new props - addressed in Task 5)

**Step 3: Commit**

```bash
git add components/recalibration/recalibration-task-card.tsx
git commit -m "refactor(recalibration): redesign task card with accordion expand/collapse"
```

---

### Task 5: Update RecalibrationModal with accordion state and simplified chrome

Add `expandedTaskId` state, simplified header with task count, remove progress bar and snooze.

**Files:**
- Modify: `components/recalibration/recalibration-modal.tsx` (full rewrite, currently 236 lines)

**Step 1: Rewrite the component**

Replace the entire contents of `components/recalibration/recalibration-modal.tsx` with:

```tsx
'use client';

import { useState } from 'react';
import { Task, Profile, PendingTaskChanges } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RecalibrationSection } from './recalibration-section';
import { RecalibrationTaskCard } from './recalibration-task-card';
import { useRecalibration } from '@/hooks/use-recalibration';
import { Sunrise } from 'lucide-react';

interface RecalibrationModalProps {
  tasks: Task[];
  profile: Profile;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveChanges: (
    changes: Array<{ taskId: string; changes: PendingTaskChanges }>
  ) => Promise<void>;
  onTaskComplete: (taskId: string) => void;
  onSkipToday: () => void;
}

export function RecalibrationModal({
  tasks,
  profile,
  isOpen,
  onOpenChange,
  onSaveChanges,
  onTaskComplete,
  onSkipToday,
}: RecalibrationModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const {
    visibleTasks,
    totalTaskCount,
    pendingChanges,
    reviewedTaskIds,
    updateTaskChanges,
    markTaskReviewed,
    hideTask,
    hasChanges,
    getAllPendingChanges,
  } = useRecalibration(tasks, {
    triggerTime: profile.recalibration_time || '17:00:00',
    includeTomorrow: profile.recalibration_include_tomorrow ?? true,
    enabled: profile.recalibration_enabled ?? true,
  });

  const handleDone = async () => {
    if (hasChanges) {
      setIsSaving(true);
      try {
        await onSaveChanges(getAllPendingChanges());
      } finally {
        setIsSaving(false);
      }
    }
    onSkipToday();
  };

  const handleTaskComplete = (taskId: string) => {
    onTaskComplete(taskId);
    hideTask(taskId);
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    }
  };

  const handleToggleExpand = (taskId: string) => {
    setExpandedTaskId(prev => prev === taskId ? null : taskId);
  };

  const handleMarkReviewed = (taskId: string) => {
    markTaskReviewed(taskId);
    // Collapse after marking as reviewed
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    }
  };

  // Empty state
  if (totalTaskCount === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="dialog-sheet max-w-lg">
          <div className="text-center py-8">
            <div className="text-4xl mb-4">&#10024;</div>
            <h2 className="text-xl font-semibold mb-2">All caught up!</h2>
            <p className="text-muted-foreground mb-6">
              No tasks need your attention right now. Great job staying on top
              of things!
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
            <Sunrise className="h-5 w-5 text-amber-500" aria-hidden="true" />
            Daily Recalibration
          </DialogTitle>
          <DialogDescription>
            {totalTaskCount} {totalTaskCount === 1 ? 'task' : 'tasks'} to review
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable task list */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {visibleTasks.overdue.length > 0 && (
            <RecalibrationSection
              title="Overdue"
              count={visibleTasks.overdue.length}
              variant="warning"
            >
              {visibleTasks.overdue.map((task) => (
                <RecalibrationTaskCard
                  key={task.id}
                  task={task}
                  pendingChanges={pendingChanges.get(task.id)}
                  isReviewed={reviewedTaskIds.has(task.id)}
                  isExpanded={expandedTaskId === task.id}
                  onToggleExpand={() => handleToggleExpand(task.id)}
                  onUpdateChanges={(changes) =>
                    updateTaskChanges(task.id, changes)
                  }
                  onComplete={() => handleTaskComplete(task.id)}
                  onHide={() => hideTask(task.id)}
                  onMarkReviewed={() => handleMarkReviewed(task.id)}
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
              {visibleTasks.dueToday.map((task) => (
                <RecalibrationTaskCard
                  key={task.id}
                  task={task}
                  pendingChanges={pendingChanges.get(task.id)}
                  isReviewed={reviewedTaskIds.has(task.id)}
                  isExpanded={expandedTaskId === task.id}
                  onToggleExpand={() => handleToggleExpand(task.id)}
                  onUpdateChanges={(changes) =>
                    updateTaskChanges(task.id, changes)
                  }
                  onComplete={() => handleTaskComplete(task.id)}
                  onHide={() => hideTask(task.id)}
                  onMarkReviewed={() => handleMarkReviewed(task.id)}
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
              {visibleTasks.dueTomorrow.map((task) => (
                <RecalibrationTaskCard
                  key={task.id}
                  task={task}
                  pendingChanges={pendingChanges.get(task.id)}
                  isReviewed={reviewedTaskIds.has(task.id)}
                  isExpanded={expandedTaskId === task.id}
                  onToggleExpand={() => handleToggleExpand(task.id)}
                  onUpdateChanges={(changes) =>
                    updateTaskChanges(task.id, changes)
                  }
                  onComplete={() => handleTaskComplete(task.id)}
                  onHide={() => hideTask(task.id)}
                  onMarkReviewed={() => handleMarkReviewed(task.id)}
                />
              ))}
            </RecalibrationSection>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t pt-3 flex gap-3">
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
            {isSaving ? 'Saving...' : 'Done'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

Key changes:
- Added `expandedTaskId` state for accordion behavior
- Removed `Clock` icon import (was for snooze)
- Removed progress bar (reviewed count, percentage, bar)
- Replaced `DialogDescription` with task count: "N tasks to review"
- Removed `onSnooze` prop entirely
- Removed snooze button from footer
- Footer is now just `flex gap-3` with two buttons (no `space-y-3` wrapper)
- `handleMarkReviewed` now also collapses the card
- `handleTaskComplete` collapses the card if it was expanded
- Passes `isExpanded` and `onToggleExpand` to each task card

**Step 2: Verify build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: Errors about `onSnooze` prop in dashboard-client.tsx (fixed in Task 6)

**Step 3: Commit**

```bash
git add components/recalibration/recalibration-modal.tsx
git commit -m "refactor(recalibration): simplify modal with accordion cards, remove progress bar and snooze"
```

---

### Task 6: Remove snooze from hook and dashboard integration

Clean up snooze references from `use-recalibration.ts` and `dashboard-client.tsx`.

**Files:**
- Modify: `hooks/use-recalibration.ts:8,13-34,44,59,179-183,205-222`
- Modify: `components/dashboard/dashboard-client.tsx` (remove snooze references)

**Step 1: Clean up the hook**

In `hooks/use-recalibration.ts`:

Remove the `getSnoozeEndTime` import at line 8 (keep the other imports):

```typescript
import {
  getTasksForRecalibration,
  shouldShowRecalibration,
  parseTriggerHour,
} from '@/lib/utils/recalibration-utils';
```

Remove the entire snooze localStorage section (lines 12-34):

```typescript
// DELETE: SNOOZE_STORAGE_KEY constant
// DELETE: getSnoozedUntil function
// DELETE: setSnoozedUntil function
```

In the `UseRecalibrationReturn` interface, remove the `snooze` property (line 59).

In the `useEffect` for auto-trigger (around line 122-133), remove the snooze check. Change:

```typescript
  useEffect(() => {
    if (hasCheckedTrigger || !enabled) return;

    if (shouldShowRecalibration(tasks, triggerHour, lastDismissedDate, enabled)) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
    setHasCheckedTrigger(true);
  }, [tasks, triggerHour, hasCheckedTrigger, enabled, lastDismissedDate]);
```

Remove the `snooze` callback (lines 179-183).

In `skipToday`, remove the `setSnoozedUntil(null)` call.

In the return object, remove `snooze`.

**Step 2: Update shouldShowRecalibration signature**

In `lib/utils/recalibration-utils.ts`, update `shouldShowRecalibration` to remove the `snoozedUntil` parameter:

```typescript
export function shouldShowRecalibration(
  tasks: Task[],
  triggerHour: number = 17,
  lastDismissedDate: string | null,
  isEnabled: boolean = true
): boolean {
  if (!isEnabled) {
    return false;
  }

  const today = getTodayLocal();
  const now = new Date();
  const currentHour = now.getHours();

  if (currentHour < triggerHour) {
    return false;
  }

  if (lastDismissedDate === today) {
    return false;
  }

  const { overdue, dueToday } = getTasksForRecalibration(tasks, false);
  return overdue.length > 0 || dueToday.length > 0;
}
```

Also remove the `getSnoozeEndTime` export and the `RecalibrationLocalStorage` import (if it's only used for snooze).

**Step 3: Update dashboard-client.tsx**

In `components/dashboard/dashboard-client.tsx`, remove the `snooze` destructuring and the `onSnooze` prop:

Change the hook destructuring (around line 173-185) to remove `snooze: snoozeRecalibration`:

```typescript
  const {
    isOpen: isRecalibrationOpen,
    setIsOpen: setRecalibrationOpen,
    skipToday: skipRecalibrationToday,
    openManually: openRecalibrationManually,
  } = useRecalibration(tasks, {
    triggerTime: profile.recalibration_time || '17:00:00',
    includeTomorrow: profile.recalibration_include_tomorrow ?? true,
    enabled: profile.recalibration_enabled ?? true,
    lastDismissedDate: profile.recalibration_last_dismissed_date ?? null,
    onDismiss: handleDismissRecalibration,
  });
```

Remove the `onSnooze` prop from the `<RecalibrationModal>` usage (around line 312).

**Step 4: Verify build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 5: Run dev server and test**

Run: `npm run dev`
Expected: App starts without errors. Navigate to dashboard, trigger recalibration manually.

**Step 6: Commit**

```bash
git add hooks/use-recalibration.ts lib/utils/recalibration-utils.ts components/dashboard/dashboard-client.tsx
git commit -m "refactor(recalibration): remove snooze functionality, clean up hook and dashboard integration"
```

---

### Task 7: Visual polish pass with frontend-design skill

Use the `frontend-design` skill to review and polish the redesigned components. Invoke: `@frontend-design`

Focus areas:
- Ensure the accordion expand/collapse animation is smooth (consider adding `transition-all` or `animate-in`)
- Check mobile bottom sheet layout at 375px width
- Verify the collapsed card density feels right (not too tight, not too loose)
- Ensure the blue modification indicators are visible but not distracting
- Check dark mode rendering for all states

**Step 1: Run dev server and inspect visually**

Run: `npm run dev`
Open browser at http://localhost:3000, navigate to dashboard, trigger recalibration.
Test: collapsed cards, expanding, changing dates, importance/urgency, keep-as-is, completing tasks.
Test on mobile viewport (375px width in devtools).

**Step 2: Make any final polish adjustments**

Based on visual review, adjust spacing, colors, or transitions as needed.

**Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add -A
git commit -m "style(recalibration): visual polish for accordion cards and mobile layout"
```

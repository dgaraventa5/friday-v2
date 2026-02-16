# Mission Control Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild Friday's dashboard as a gamified "Mission Control" experience with ranked task tiles, momentum bar, inline quick-add, no bottom nav, and smart priority transparency.

**Architecture:** Replace the current Today/Schedule views and bottom nav with a new component set: MomentumBar, TaskTile (expandable), InlineQuickAdd, and a header-based pill toggle. All data flow (hooks, services, types) stays unchanged. New utility function `getPriorityReason()` surfaces the scoring algorithm's reasoning. Framer Motion (already installed) powers entrance/completion animations.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion 12, Radix UI, Lucide icons

---

## Task Overview

| # | Task | Files | Dependencies |
|---|------|-------|-------------|
| 1 | Visual foundation — warm tokens + animations | `globals.css`, `layout.tsx` | None |
| 2 | `getPriorityReason()` + `getScoreBreakdown()` utils (TDD) | `task-prioritization.ts`, new test file | None |
| 3 | MomentumBar component | New: `components/today/momentum-bar.tsx` | Task 1 |
| 4 | TaskTile component | New: `components/today/task-tile.tsx` | Tasks 1, 2 |
| 5 | InlineQuickAdd component | New: `components/today/inline-quick-add.tsx` | Task 1 |
| 6 | Update AppHeader with pill toggle | Modify: `components/dashboard/app-header.tsx` | Task 1 |
| 7 | Rebuild TodayView | Modify: `components/today/today-view.tsx` | Tasks 3, 4, 5 |
| 8 | Rebuild ScheduleView as timeline | Modify: `components/schedule/schedule-view.tsx` | Tasks 1, 2 |
| 9 | Update DashboardClient (wire everything) | Modify: `components/dashboard/dashboard-client.tsx` | Tasks 6, 7, 8 |
| 10 | Framer Motion entrance + completion animations | Modify: tasks 3, 4, 7 | Task 9 |

---

### Task 1: Visual Foundation — Warm Tokens + Animations

**Files:**
- Modify: `app/globals.css` (lines 30-38 for background, add new animations after line 577)
- Modify: `app/layout.tsx` (add DM Sans font import)

**Step 1: Update the background color to warm off-white**

In `app/globals.css`, change the light mode background variable:

```css
/* In :root section (~line 76) */
--background: #FFFDF7;  /* was: var(--slate-50) */
```

Add warm stone color tokens for the Mission Control text palette:

```css
/* Add after the orange variables (~line 73) */
/* Stone - Warm Neutral (Mission Control text palette) */
--stone-600: #57534E;
--stone-800: #292524;
--stone-950: #1C1917;
```

**Step 2: Add DM Sans font to the app**

In `app/layout.tsx`, import DM Sans from Google Fonts via `next/font/google` alongside the existing Geist font. Set it as a CSS variable `--font-display`.

In `globals.css` `@theme inline` section, add:
```css
--font-display: var(--font-dm-sans), 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
```

**Step 3: Add momentum bar animations to globals.css**

Append to the `@layer utilities` section (after line 621):

```css
/* Momentum Bar Shimmer */
@keyframes momentum-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

.momentum-bar-fill {
  background: linear-gradient(90deg, #F59E0B 0%, #FCD34D 50%, #F59E0B 100%);
  position: relative;
  overflow: hidden;
}

.momentum-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
  animation: momentum-shimmer 2s ease-in-out infinite;
}

/* Momentum bar completion glow */
@keyframes momentum-complete {
  0% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.4); }
  50% { box-shadow: 0 0 12px 4px rgba(250, 204, 21, 0.3); }
  100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); }
}

.momentum-complete {
  animation: momentum-complete 1s ease-out;
}

/* Task tile entrance (stagger via animation-delay) */
@keyframes tile-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-tile-enter {
  animation: tile-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* Task completion compress */
@keyframes tile-complete {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.95); opacity: 0.7; }
  100% { transform: scale(1); opacity: 0.5; }
}

.animate-tile-complete {
  animation: tile-complete 0.4s ease-out forwards;
}

/* Score breakdown bar fill */
@keyframes bar-fill {
  from { width: 0; }
  to { width: var(--bar-width); }
}

.animate-bar-fill {
  animation: bar-fill 0.5s ease-out forwards;
}
```

**Step 4: Add warm card styles**

```css
/* Mission Control warm card */
.mc-card {
  background: #FFFFFF;
  border: 1px solid #FEF3C7; /* amber-100 */
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(180, 140, 60, 0.06), 0 1px 2px -1px rgba(180, 140, 60, 0.06);
  transition: box-shadow 0.25s ease-out, transform 0.25s ease-out;
}

.mc-card:hover {
  box-shadow: 0 4px 12px -2px rgba(180, 140, 60, 0.1), 0 2px 6px -2px rgba(180, 140, 60, 0.06);
  transform: translateY(-1px);
}

.dark .mc-card {
  background: #1E293B;
  border-color: #334155;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
}
```

**Step 5: Run `npm run dev` to verify no CSS errors**

Run: `npm run dev`
Expected: Dev server starts with no CSS parse errors.

**Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: add Mission Control visual foundation — warm tokens, animations, DM Sans"
```

---

### Task 2: `getPriorityReason()` + `getScoreBreakdown()` Utilities (TDD)

**Files:**
- Modify: `lib/utils/task-prioritization.ts` (add new exported functions at the end)
- Create: `__tests__/lib/utils/task-prioritization-reason.test.ts`

**Step 1: Write failing tests**

Create `__tests__/lib/utils/task-prioritization-reason.test.ts`:

```typescript
import { getPriorityReason, getScoreBreakdown } from '@/lib/utils/task-prioritization';
import { Task } from '@/lib/types';

// Helper to create a minimal task
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'test-1',
    user_id: 'user-1',
    title: 'Test task',
    description: null,
    importance: 'important',
    urgency: 'urgent',
    due_date: null,
    start_date: null,
    pinned_date: null,
    estimated_hours: 1,
    category: 'Work',
    completed: false,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_recurring: false,
    recurring_series_id: null,
    recurring_interval: null,
    recurring_days: null,
    recurring_end_type: null,
    recurring_end_count: null,
    is_mit: false,
    priority: null,
    ...overrides,
  } as Task;
}

describe('getPriorityReason', () => {
  it('returns overdue reason for past-due tasks', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);
    const dateStr = yesterday.toISOString().split('T')[0];

    const task = makeTask({ due_date: dateStr });
    const reason = getPriorityReason(task);
    expect(reason).toMatch(/overdue/i);
  });

  it('returns "Due today" for tasks due today', () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const task = makeTask({ due_date: dateStr });
    const reason = getPriorityReason(task);
    expect(reason).toMatch(/due today/i);
  });

  it('returns deadline info for tasks due within 3 days', () => {
    const future = new Date();
    future.setDate(future.getDate() + 2);
    const dateStr = future.toISOString().split('T')[0];

    const task = makeTask({ due_date: dateStr });
    const reason = getPriorityReason(task);
    expect(reason).toMatch(/due|tomorrow|days/i);
  });

  it('returns quadrant-based reason when no deadline pressure', () => {
    const task = makeTask({ due_date: null, urgency: 'urgent', importance: 'important' });
    const reason = getPriorityReason(task);
    expect(reason).toMatch(/urgent|important|critical/i);
  });

  it('returns duration pressure reason for large tasks near deadline', () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const dateStr = future.toISOString().split('T')[0];

    const task = makeTask({ due_date: dateStr, estimated_hours: 8 });
    const reason = getPriorityReason(task);
    expect(reason).toMatch(/large|hours|time/i);
  });
});

describe('getScoreBreakdown', () => {
  it('returns all four score components', () => {
    const task = makeTask({ due_date: new Date().toISOString().split('T')[0] });
    const breakdown = getScoreBreakdown(task);

    expect(breakdown).toHaveProperty('base');
    expect(breakdown).toHaveProperty('deadline');
    expect(breakdown).toHaveProperty('duration');
    expect(breakdown).toHaveProperty('age');
    expect(breakdown).toHaveProperty('total');
  });

  it('base score is 100 for urgent+important', () => {
    const task = makeTask({ urgency: 'urgent', importance: 'important' });
    const breakdown = getScoreBreakdown(task);
    expect(breakdown.base).toBe(100);
  });

  it('base score is 40 for not-urgent+not-important', () => {
    const task = makeTask({ urgency: 'not-urgent', importance: 'not-important' });
    const breakdown = getScoreBreakdown(task);
    expect(breakdown.base).toBe(40);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern="task-prioritization-reason" --verbose`
Expected: FAIL — functions not yet exported

**Step 3: Implement `getPriorityReason()` and `getScoreBreakdown()`**

Add to end of `lib/utils/task-prioritization.ts` (before the closing of the file):

```typescript
/**
 * Score breakdown for transparent priority display.
 * Each component shows its raw contribution to the total score.
 */
export interface ScoreBreakdown {
  base: number;       // Eisenhower quadrant (40-100)
  deadline: number;   // Due date pressure (0-200+)
  duration: number;   // Duration pressure (0-120+)
  age: number;        // Age factor (0-10)
  total: number;      // Sum of all components
}

/**
 * Get individual score components for a task.
 * Used to render the score breakdown bars in expanded task tiles.
 */
export function getScoreBreakdown(task: Task): ScoreBreakdown {
  const quadrant = getEisenhowerQuadrant(task);
  const base = QUADRANT_SCORES[quadrant];
  const deadline = calculateDueDateScore(task);
  const duration = calculateDurationPressure(task);

  const todayStr = getTodayLocal();
  const today = parseDateLocal(todayStr);
  const createdDate = new Date(task.created_at);
  createdDate.setHours(0, 0, 0, 0);
  const daysOld = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const age = Math.min(daysOld * 1, 10);

  return {
    base,
    deadline,
    duration,
    age,
    total: base + deadline + duration + age,
  };
}

/**
 * Generate a one-line human-readable explanation of why a task is prioritized.
 * Shows the dominant factor driving the task's score.
 *
 * Priority of reasons (first match wins):
 * 1. Overdue → "Overdue by X days"
 * 2. Due today → "Due today"
 * 3. Due tomorrow → "Due tomorrow"
 * 4. Due within 3 days → "Due in X days"
 * 5. Duration pressure (large task + near deadline) → "X hours, due in Y days"
 * 6. Due within 7 days → "Due in X days"
 * 7. Quadrant-based → "Urgent + Important" / "High impact" / etc.
 * 8. Age → "Aging X days"
 * 9. Default → "Scheduled today"
 */
export function getPriorityReason(task: Task): string {
  if (task.completed) return 'Completed';

  const todayStr = getTodayLocal();

  // Check due date first — it's the most actionable info
  if (task.due_date) {
    const today = parseDateLocal(todayStr);
    const dueDate = parseDateLocal(task.due_date);
    const daysUntilDue = Math.floor(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDue < 0) {
      const daysOverdue = Math.abs(daysUntilDue);
      return daysOverdue === 1 ? 'Overdue by 1 day' : `Overdue by ${daysOverdue} days`;
    }

    if (daysUntilDue === 0) return 'Due today';
    if (daysUntilDue === 1) {
      // Check duration pressure for large tasks due tomorrow
      if (task.estimated_hours >= 4) {
        return `${task.estimated_hours}h task, due tomorrow`;
      }
      return 'Due tomorrow';
    }
    if (daysUntilDue <= 3) {
      if (task.estimated_hours >= 4) {
        return `${task.estimated_hours}h task, due in ${daysUntilDue} days`;
      }
      return `Due in ${daysUntilDue} days`;
    }
    if (daysUntilDue <= 7) return `Due in ${daysUntilDue} days`;
  }

  // Quadrant-based reasons when no immediate deadline pressure
  const quadrant = getEisenhowerQuadrant(task);
  if (quadrant === 'urgent-important') return 'Urgent + Important';
  if (quadrant === 'not-urgent-important') return 'High impact';
  if (quadrant === 'urgent-not-important') return 'Urgent';

  // Age factor
  const today = parseDateLocal(todayStr);
  const createdDate = new Date(task.created_at);
  createdDate.setHours(0, 0, 0, 0);
  const daysOld = Math.floor(
    (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysOld >= 3) return `Aging ${daysOld} days`;

  // Default
  return 'Scheduled today';
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="task-prioritization-reason" --verbose`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/utils/task-prioritization.ts __tests__/lib/utils/task-prioritization-reason.test.ts
git commit -m "feat: add getPriorityReason() and getScoreBreakdown() utilities with tests"
```

---

### Task 3: MomentumBar Component

**Files:**
- Create: `components/today/momentum-bar.tsx`

**Step 1: Create the MomentumBar component**

Create `components/today/momentum-bar.tsx`:

```tsx
'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getMotivationalText } from '@/lib/utils/stats-utils';
import { Flame } from 'lucide-react';

interface MomentumBarProps {
  completedCount: number;
  totalCount: number;
  streak: number;
  className?: string;
}

export function MomentumBar({
  completedCount,
  totalCount,
  streak,
  className,
}: MomentumBarProps) {
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isComplete = totalCount > 0 && completedCount >= totalCount;

  const motivationalText = useMemo(
    () => getMotivationalText(completedCount, totalCount, streak),
    [completedCount, totalCount, streak]
  );

  return (
    <div className={cn('px-4 py-3 sm:px-6', className)}>
      {/* Top row: motivational text + streak + count */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-stone-600 dark:text-slate-400">
          {motivationalText}
        </span>
        <div className="flex items-center gap-3">
          {/* Streak */}
          <div className="flex items-center gap-1">
            <Flame
              className={cn(
                'h-4 w-4',
                streak > 0 ? 'text-orange-500' : 'text-slate-300 dark:text-slate-600'
              )}
              fill={streak > 0 ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
            <span
              className={cn(
                'text-sm font-semibold font-mono',
                streak > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'
              )}
            >
              {streak}
            </span>
          </div>

          {/* Task count */}
          <span className="text-sm font-semibold font-mono text-stone-800 dark:text-slate-200">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-amber-100 dark:bg-slate-700 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            isComplete ? 'momentum-complete' : '',
            progress > 0 ? 'momentum-bar-fill' : ''
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-label={`${completedCount} of ${totalCount} tasks completed`}
        />
      </div>
    </div>
  );
}
```

**Step 2: Verify it renders in dev (visual check later in Task 7)**

No test runner needed — this will be wired in Task 7.

**Step 3: Commit**

```bash
git add components/today/momentum-bar.tsx
git commit -m "feat: add MomentumBar component with gradient fill and shimmer"
```

---

### Task 4: TaskTile Component

**Files:**
- Create: `components/today/task-tile.tsx`

**Step 1: Create the TaskTile component**

Create `components/today/task-tile.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Task } from '@/lib/types';
import { getEisenhowerQuadrant, getPriorityReason, getScoreBreakdown } from '@/lib/utils/task-prioritization';
import { formatDateStringForDisplay } from '@/lib/utils/date-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MoreVertical, Clock, Calendar, Repeat, Pencil, Trash2, Pin, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TaskTileProps {
  task: Task;
  rank: number;
  onComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  style?: React.CSSProperties;
  className?: string;
}

const QUADRANT_BORDER = {
  'urgent-important': 'border-l-red-500',
  'not-urgent-important': 'border-l-blue-500',
  'urgent-not-important': 'border-l-amber-500',
  'not-urgent-not-important': 'border-l-slate-400',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  Work: '\u{1F4BC}',
  Home: '\u{1F3E0}',
  Health: '\u{2764}\u{FE0F}',
  Personal: '\u{2B50}',
};

export function TaskTile({ task, rank, onComplete, onEdit, onDelete, style, className }: TaskTileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const quadrant = getEisenhowerQuadrant(task);
  const priorityReason = getPriorityReason(task);
  const borderColor = QUADRANT_BORDER[quadrant];

  return (
    <div
      className={cn(
        'mc-card border-l-4 p-3 sm:p-4',
        borderColor,
        task.completed && 'animate-tile-complete',
        className
      )}
      style={style}
    >
      {/* Main row */}
      <div className="flex items-start gap-3">
        {/* Rank badge */}
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold font-mono',
            task.completed
              ? 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          )}
        >
          {rank}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  'text-sm font-semibold leading-tight text-stone-800 dark:text-slate-100',
                  task.completed && 'line-through text-stone-400 dark:text-slate-500'
                )}
              >
                {task.title}
              </h3>
              {/* Priority reason */}
              <p className={cn(
                'text-xs mt-0.5 text-stone-500 dark:text-slate-400',
                task.completed && 'text-stone-300 dark:text-slate-600'
              )}>
                {priorityReason}
                {task.category && (
                  <span className="ml-2" title={task.category}>
                    {CATEGORY_EMOJIS[task.category]}
                  </span>
                )}
              </p>
            </div>

            {/* Right side: checkbox + menu */}
            <div className="flex items-center gap-1 shrink-0">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onComplete(task.id)}
                className="h-5 w-5"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-slate-700"
                    aria-label="Task options"
                  >
                    <MoreVertical className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Pencil className="h-4 w-4 mr-2" aria-hidden="true" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(task.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Expand toggle */}
      {!task.completed && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
          aria-expanded={isExpanded}
        >
          <ChevronDown className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-180')} />
          <span>{isExpanded ? 'Less' : 'Details'}</span>
        </button>
      )}

      {/* Expanded details */}
      {isExpanded && !task.completed && (
        <ExpandedDetails task={task} />
      )}
    </div>
  );
}

function ExpandedDetails({ task }: { task: Task }) {
  const breakdown = getScoreBreakdown(task);

  // Normalize scores for bar widths (relative to max component)
  const maxComponent = Math.max(breakdown.base, breakdown.deadline, breakdown.duration, breakdown.age, 1);
  const factors = [
    { label: 'Importance', value: breakdown.base, color: 'bg-blue-400' },
    { label: 'Deadline', value: breakdown.deadline, color: 'bg-red-400' },
    { label: 'Time pressure', value: breakdown.duration, color: 'bg-amber-400' },
    { label: 'Age', value: breakdown.age, color: 'bg-slate-400' },
  ].filter(f => f.value > 0);

  return (
    <div className="mt-3 pt-3 border-t border-amber-100 dark:border-slate-700 space-y-3">
      {/* Description */}
      {task.description && (
        <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Score breakdown bars */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">Priority factors</p>
        {factors.map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-[10px] text-stone-500 w-20 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-stone-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full animate-bar-fill', color)}
                style={{ '--bar-width': `${(value / maxComponent) * 100}%` } as React.CSSProperties}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap gap-3 text-xs text-stone-500 dark:text-slate-400">
        {task.due_date && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            <span>Due {formatDateStringForDisplay(task.due_date)}</span>
          </div>
        )}
        {task.estimated_hours > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>{task.estimated_hours}h estimated</span>
          </div>
        )}
        {task.is_recurring && (
          <div className="flex items-center gap-1">
            <Repeat className="h-3 w-3" aria-hidden="true" />
            <span>{task.recurring_interval}</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/today/task-tile.tsx
git commit -m "feat: add TaskTile component with rank badge, priority reason, expandable details"
```

---

### Task 5: InlineQuickAdd Component

**Files:**
- Create: `components/today/inline-quick-add.tsx`

**Step 1: Create the InlineQuickAdd component**

Create `components/today/inline-quick-add.tsx`:

```tsx
'use client';

import { useState, useRef } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineQuickAddProps {
  onQuickAdd: (title: string) => void;
  onOpenFullForm: () => void;
  className?: string;
}

export function InlineQuickAdd({ onQuickAdd, onOpenFullForm, className }: InlineQuickAddProps) {
  const [isActive, setIsActive] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onQuickAdd(trimmed);
    setTitle('');
    // Keep input focused for rapid entry
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setTitle('');
      setIsActive(false);
      inputRef.current?.blur();
    }
  };

  if (!isActive) {
    return (
      <button
        onClick={() => {
          setIsActive(true);
          // Focus after state update
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className={cn(
          'w-full rounded-xl border-2 border-dashed border-amber-200 dark:border-slate-600 p-3 sm:p-4',
          'flex items-center gap-2 text-sm text-stone-400 dark:text-slate-500',
          'hover:border-amber-300 hover:text-stone-500 dark:hover:border-slate-500',
          'transition-colors',
          className
        )}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        <span>Add a task...</span>
      </button>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border-2 border-amber-300 dark:border-amber-600 bg-white dark:bg-slate-800 p-2 sm:p-3',
      'flex items-center gap-2',
      className
    )}>
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!title.trim()) setIsActive(false);
        }}
        placeholder="Type a task and press Enter..."
        className="flex-1 bg-transparent text-sm text-stone-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 outline-none"
        autoFocus
      />
      <button
        onClick={onOpenFullForm}
        className="shrink-0 flex items-center gap-1 text-xs text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        title="Open full task form"
      >
        <span className="hidden sm:inline">More</span>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/today/inline-quick-add.tsx
git commit -m "feat: add InlineQuickAdd component with quick-entry and full form toggle"
```

---

### Task 6: Update AppHeader with Pill Toggle

**Files:**
- Modify: `components/dashboard/app-header.tsx`

**Step 1: Add pill toggle props and render segmented control**

Update the AppHeader to accept `currentView` and `onViewChange` props. Add a segmented control between the logo and avatar.

The segmented control is a simple `<div>` with two buttons styled as a pill. The active button gets the amber/gold accent.

Key changes to `app-header.tsx`:
- Add to interface: `currentView: 'today' | 'schedule'` and `onViewChange: (view: 'today' | 'schedule') => void`
- Insert segmented control in the header between the logo and the right-side controls
- Style: rounded-full background of `bg-stone-100`, active button gets `bg-white shadow-sm`
- Remove the hard-refresh dropdown menu item (this is a developer tool, not user-facing)

```tsx
{/* Pill Toggle — in the center of the header */}
<div className="flex items-center rounded-full bg-stone-100 dark:bg-slate-800 p-0.5">
  <button
    onClick={() => onViewChange('today')}
    className={cn(
      'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
      currentView === 'today'
        ? 'bg-white text-stone-800 shadow-sm dark:bg-slate-700 dark:text-slate-100'
        : 'text-stone-500 hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200'
    )}
  >
    Today
  </button>
  <button
    onClick={() => onViewChange('schedule')}
    className={cn(
      'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
      currentView === 'schedule'
        ? 'bg-white text-stone-800 shadow-sm dark:bg-slate-700 dark:text-slate-100'
        : 'text-stone-500 hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200'
    )}
  >
    Schedule
  </button>
</div>
```

**Step 2: Run `npm run dev` and verify the header renders**

Run: `npm run dev`
Expected: Header shows with pill toggle (it won't be wired to views yet)

**Step 3: Commit**

```bash
git add components/dashboard/app-header.tsx
git commit -m "feat: add pill toggle to AppHeader for Today/Schedule navigation"
```

---

### Task 7: Rebuild TodayView

**Files:**
- Modify: `components/today/today-view.tsx` (major rewrite)

**Step 1: Rewrite today-view.tsx with new layout**

Replace the entire component with the new Mission Control layout:

- **Mobile**: MomentumBar → TaskTiles (ranked #1-#4) → InlineQuickAdd → Completed (collapsible) → Calendar/Reminders (compact)
- **Desktop (lg+)**: Two-column — left: MomentumBar + TaskTiles + QuickAdd, right: Calendar + Reminders + WeekActivity

Key changes:
- Import `MomentumBar` instead of `ProgressHero`/`ProgressDock`
- Import `TaskTile` instead of `TaskCard`
- Import `InlineQuickAdd`
- Remove the desktop/mobile dual-render pattern (`lg:hidden` / `hidden lg:block`)
- Use a single responsive layout that works for both
- Add `rank` prop to TaskTile based on index
- Add collapsible completed section with `useState`
- Wire `InlineQuickAdd`'s `onQuickAdd` to create a task with minimal defaults
- Wire `onOpenFullForm` to `onOpenAddDialog`

The new component receives an additional prop: `onQuickAdd: (title: string) => void` — a simplified task creation handler that creates a task with just a title and sensible defaults.

Important: The `onQuickAdd` handler should be added to the `DashboardClient` (Task 9), which calls `addTask` with defaults:
- `importance: 'not-important'`
- `urgency: 'not-urgent'`
- `category: 'Personal'`
- `estimated_hours: 1`

Friday's scheduling algorithm will automatically score and schedule it.

**Step 2: Run `npm run dev` and verify the new layout renders**

Run: `npm run dev`
Expected: Today view shows MomentumBar, ranked TaskTiles, InlineQuickAdd

**Step 3: Commit**

```bash
git add components/today/today-view.tsx
git commit -m "feat: rebuild TodayView with Mission Control layout — momentum bar, ranked tiles, quick-add"
```

---

### Task 8: Rebuild ScheduleView as Vertical Timeline

**Files:**
- Modify: `components/schedule/schedule-view.tsx`

**Step 1: Rewrite with timeline layout**

Replace the current list-based schedule view with a vertical timeline:

- Vertical line on the left (thin `border-l` on a wrapper div)
- Date section headers as timeline nodes (dot + date + task count + total hours)
- Overdue section at top with red tint
- Today section pinned/highlighted
- Upcoming days are collapsible sections
- Tasks within each day use compact rows (not full TaskTiles — simpler display)
- Each task row: checkbox + title + quadrant badge + due date

Key structure:
```tsx
<div className="relative pl-6">
  {/* Timeline line */}
  <div className="absolute left-2 top-0 bottom-0 w-px bg-amber-200 dark:bg-slate-700" />

  {/* For each date group */}
  <div className="relative mb-6">
    {/* Timeline dot */}
    <div className="absolute -left-4 top-1 h-3 w-3 rounded-full border-2 border-amber-400 bg-white" />

    {/* Date header */}
    <div className="flex items-center gap-2 mb-2">
      <h3 className="text-sm font-semibold">Today, Feb 16</h3>
      <span className="text-xs text-stone-400">4 tasks</span>
    </div>

    {/* Task rows */}
    {tasks.map(task => (
      <ScheduleTaskRow key={task.id} task={task} ... />
    ))}
  </div>
</div>
```

**Step 2: Verify in dev**

Run: `npm run dev`
Expected: Schedule view shows vertical timeline with date sections

**Step 3: Commit**

```bash
git add components/schedule/schedule-view.tsx
git commit -m "feat: rebuild ScheduleView as vertical timeline with collapsible day sections"
```

---

### Task 9: Update DashboardClient — Wire Everything Together

**Files:**
- Modify: `components/dashboard/dashboard-client.tsx`

**Step 1: Remove BottomNav and wire new navigation**

Key changes:
- Remove `import { BottomNav }` and the `<BottomNav />` component
- Pass `currentView` and `onViewChange` to `<AppHeader />`
- Remove `overflow-hidden` from the root div (no bottom nav means natural scrolling)
- Remove `pb-24`/`pb-32` spacer classes (no bottom nav to avoid)
- Add `onQuickAdd` handler that calls `addTask` with minimal defaults
- Pass `onQuickAdd` and `onOpenAddDialog` to `TodayView`

New `handleQuickAdd` function:
```typescript
const handleQuickAdd = async (title: string) => {
  await addTask({
    title,
    description: '',
    importance: 'not-important',
    urgency: 'not-urgent',
    category: 'Personal',
    estimated_hours: 1,
    due_date: null,
    is_recurring: false,
    recurring_interval: null,
    recurring_days: null,
    recurring_end_type: null,
    recurring_end_count: null,
  });
};
```

**Step 2: Test the full flow in dev**

Run: `npm run dev`
Expected:
- No bottom nav
- Header pill toggle switches between Today and Schedule
- Today view shows MomentumBar, ranked TaskTiles, InlineQuickAdd
- Quick-add creates tasks that appear after refresh
- Schedule view shows vertical timeline
- Task completion updates momentum bar
- Expanding a tile shows score breakdown

**Step 3: Commit**

```bash
git add components/dashboard/dashboard-client.tsx
git commit -m "feat: wire Mission Control dashboard — remove bottom nav, connect header toggle + quick-add"
```

---

### Task 10: Framer Motion Entrance + Completion Animations

**Files:**
- Modify: `components/today/today-view.tsx` (wrap tiles in AnimatePresence)
- Modify: `components/today/task-tile.tsx` (add motion wrapper)
- Modify: `components/today/momentum-bar.tsx` (animate progress changes)

**Step 1: Add staggered tile entrance in TodayView**

Wrap the task tiles list in Framer Motion's `AnimatePresence` and `motion.div`:

```tsx
import { motion, AnimatePresence } from 'framer-motion';

// In the render, wrap each TaskTile:
<AnimatePresence mode="popLayout">
  {incompleteTasks.map((task, index) => (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        delay: index * 0.05,
      }}
      layout
    >
      <TaskTile
        task={task}
        rank={index + 1}
        onComplete={handleTaskComplete}
        onEdit={onTaskEdit}
        onDelete={onTaskDelete}
      />
    </motion.div>
  ))}
</AnimatePresence>
```

**Step 2: Animate momentum bar progress with `motion.div`**

In `momentum-bar.tsx`, replace the static progress fill div with:

```tsx
import { motion } from 'framer-motion';

<motion.div
  className={cn(
    'h-full rounded-full',
    isComplete ? 'momentum-complete' : '',
    progress > 0 ? 'momentum-bar-fill' : ''
  )}
  initial={{ width: 0 }}
  animate={{ width: `${Math.min(progress, 100)}%` }}
  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
  role="progressbar"
  aria-valuenow={completedCount}
  aria-valuemin={0}
  aria-valuemax={totalCount}
/>
```

**Step 3: Test animations in dev**

Run: `npm run dev`
Expected:
- Tiles stagger in on page load
- Completing a task animates it out, remaining tiles reorder smoothly
- Momentum bar animates forward on completion
- New tiles from quick-add animate in

**Step 4: Verify reduced motion is respected**

Check that `prefers-reduced-motion` in globals.css still applies. Framer Motion respects this natively via `useReducedMotion()`.

**Step 5: Commit**

```bash
git add components/today/today-view.tsx components/today/task-tile.tsx components/today/momentum-bar.tsx
git commit -m "feat: add Framer Motion animations — staggered tiles, smooth progress, exit animations"
```

---

## Post-Implementation Checklist

After all tasks are complete:

1. **Visual audit**: Compare the running app against the design doc wireframes
2. **Mobile test**: Test on mobile viewport (375px) — ensure no bottom nav, tiles fill screen
3. **Desktop test**: Test on desktop viewport (1280px) — ensure sidebar layout works
4. **Accessibility**: Tab through all interactive elements, verify focus states, check screen reader labels
5. **Reduced motion**: Test with `prefers-reduced-motion: reduce` — all animations should be suppressed
6. **Dark mode**: Toggle dark mode and verify all components look correct
7. **Run tests**: `npm test` — ensure existing tests still pass + new priority reason tests pass
8. **Build**: `npm run build` — ensure no TypeScript errors
9. **Final commit + optional cleanup of now-unused components** (`progress-hero.tsx`, `progress-dock.tsx`, `progress-card.tsx`, `bottom-nav.tsx` can be removed if no longer imported anywhere)

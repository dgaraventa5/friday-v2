# Compact Add Task Form Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the AddTaskForm to fit on a single screen by using a 2-column grid layout and replacing separate importance/urgency toggles with a compact Eisenhower quadrant picker.

**Architecture:** The form stays in `components/task/add-task-form.tsx`. We extract a new `EisenhowerPicker` component for reuse (add-task and edit-task forms both need it). The layout shifts from single-column `space-y-6` to a tighter `space-y-3` grid with paired fields.

**Tech Stack:** React, Tailwind CSS, existing UI primitives (Button, Input, Label, Select, Calendar, Popover)

---

### Task 1: Create the EisenhowerPicker component

**Files:**
- Create: `components/task/eisenhower-picker.tsx`

**Step 1: Create the component file**

```tsx
'use client';

import { cn } from '@/lib/utils';

interface EisenhowerPickerProps {
  importance: 'important' | 'not-important';
  urgency: 'urgent' | 'not-urgent';
  onChange: (importance: 'important' | 'not-important', urgency: 'urgent' | 'not-urgent') => void;
}

const QUADRANTS = [
  {
    importance: 'important' as const,
    urgency: 'urgent' as const,
    label: 'Critical',
    sublabel: 'Do First',
    selected: 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900/40 dark:border-red-500 dark:text-red-300',
    hover: 'hover:bg-red-50 dark:hover:bg-red-900/20',
  },
  {
    importance: 'important' as const,
    urgency: 'not-urgent' as const,
    label: 'Plan',
    sublabel: 'Schedule',
    selected: 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-300',
    hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
  },
  {
    importance: 'not-important' as const,
    urgency: 'urgent' as const,
    label: 'Delegate',
    sublabel: 'Quick Wins',
    selected: 'bg-amber-100 border-amber-400 text-amber-800 dark:bg-amber-900/40 dark:border-amber-500 dark:text-amber-300',
    hover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
  },
  {
    importance: 'not-important' as const,
    urgency: 'not-urgent' as const,
    label: 'Backlog',
    sublabel: 'Consider',
    selected: 'bg-slate-100 border-slate-400 text-slate-700 dark:bg-slate-800 dark:border-slate-500 dark:text-slate-300',
    hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
  },
];

export function EisenhowerPicker({ importance, urgency, onChange }: EisenhowerPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Priority quadrant">
      {QUADRANTS.map((q) => {
        const isSelected = importance === q.importance && urgency === q.urgency;
        return (
          <button
            key={`${q.importance}-${q.urgency}`}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(q.importance, q.urgency)}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border py-2 px-1 transition-all duration-150 text-center',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
              isSelected
                ? cn(q.selected, 'border-2 shadow-sm')
                : cn('border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400', q.hover),
            )}
          >
            <span className={cn('text-xs font-semibold leading-tight', isSelected ? '' : 'text-slate-600 dark:text-slate-300')}>
              {q.label}
            </span>
            <span className={cn('text-[10px] leading-tight mt-0.5', isSelected ? 'opacity-80' : 'text-slate-400 dark:text-slate-500')}>
              {q.sublabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

**Step 2: Verify the component was created**

Run: `ls components/task/eisenhower-picker.tsx`
Expected: file exists

**Step 3: Commit**

```bash
git add components/task/eisenhower-picker.tsx
git commit -m "feat: add EisenhowerPicker component for compact quadrant selection"
```

---

### Task 2: Restructure AddTaskForm layout

**Files:**
- Modify: `components/task/add-task-form.tsx`

This is the main task. We restructure the form from single-column `space-y-6` to a compact grid layout.

**Step 1: Update imports**

At the top of `add-task-form.tsx`, add the EisenhowerPicker import and remove unused imports.

Replace:
```tsx
import { Checkbox } from '@/components/ui/checkbox';
```

With:
```tsx
import { Checkbox } from '@/components/ui/checkbox';
import { EisenhowerPicker } from '@/components/task/eisenhower-picker';
```

**Step 2: Replace the form JSX**

Replace the entire `return (...)` block (lines 142-373) with the new compact layout:

```tsx
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-2.5 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Task Name - full width */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Task Name</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?…"
          className="text-base"
        />
      </div>

      {/* Category + Due Date - side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={(value: any) => setCategory(value)}>
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Work">Work</SelectItem>
              <SelectItem value="Home">Home</SelectItem>
              <SelectItem value="Health">Health</SelectItem>
              <SelectItem value="Personal">Personal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dueDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {dueDate ? dueDate.toLocaleDateString() : 'Pick a date'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Hours + Eisenhower Picker - side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="hours">Est. Hours</Label>
          <Input
            id="hours"
            type="number"
            step="0.5"
            min="0.5"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Priority</Label>
          <EisenhowerPicker
            importance={importance}
            urgency={urgency}
            onChange={(imp, urg) => {
              setImportance(imp);
              setUrgency(urg);
            }}
          />
        </div>
      </div>

      {/* More options toggle */}
      <button
        type="button"
        onClick={() => setShowMoreOptions(!showMoreOptions)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md p-1 -m-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronDown className={cn('h-4 w-4 transition-transform', showMoreOptions && 'rotate-180')} aria-hidden="true" />
        More options
      </button>

      {showMoreOptions && (
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
            />
            <Label htmlFor="recurring" className="cursor-pointer mb-0">
              Make this a recurring task
            </Label>
          </div>

          {isRecurring && (
            <div className="space-y-3 pl-6">
              <div className="space-y-1.5">
                <Label htmlFor="interval">Repeat</Label>
                <Select value={recurringInterval} onValueChange={(value: any) => setRecurringInterval(value)}>
                  <SelectTrigger id="interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recurringInterval === 'weekly' && (
                <div className="space-y-1.5">
                  <Label>Repeat on</Label>
                  <div className="flex gap-1.5">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={recurringDays.includes(day.value) ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 px-0"
                        onClick={() => handleDayToggle(day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Ends</Label>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="never"
                      name="recurring-end"
                      checked={recurringEndType === 'never'}
                      onChange={() => setRecurringEndType('never')}
                      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
                    />
                    <Label htmlFor="never" className="cursor-pointer mb-0">
                      Never
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="after"
                      name="recurring-end"
                      checked={recurringEndType === 'after'}
                      onChange={() => setRecurringEndType('after')}
                      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
                    />
                    <Label htmlFor="after" className="cursor-pointer mb-0">
                      After
                    </Label>
                    {recurringEndType === 'after' && (
                      <Input
                        type="number"
                        min="1"
                        value={recurringEndCount}
                        onChange={(e) => setRecurringEndCount(e.target.value)}
                        className="w-20"
                      />
                    )}
                    {recurringEndType === 'after' && (
                      <span className="text-sm text-muted-foreground">occurrences</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Adding...' : 'Add Task'}
        </Button>
      </div>
    </form>
  );
```

**Step 3: Verify it compiles**

Run: `npx next build --no-lint 2>&1 | head -30` (or just check `npm run dev` in browser)
Expected: No TypeScript/build errors

**Step 4: Commit**

```bash
git add components/task/add-task-form.tsx
git commit -m "feat: compact add-task form with grid layout and eisenhower picker"
```

---

### Task 3: Apply same compact layout to EditTaskDialog

**Files:**
- Modify: `components/task/edit-task-dialog.tsx` (lines ~133-271)

**Step 1: Add EisenhowerPicker import**

Add to the imports at the top of `edit-task-dialog.tsx`:

```tsx
import { EisenhowerPicker } from '@/components/task/eisenhower-picker';
```

**Step 2: Replace the form body**

Replace the form JSX inside `<form onSubmit={handleSubmit} ...>` (lines 140-267) with the same compact grid layout used in AddTaskForm, but without the recurring options section.

The structure should match Task 2's layout:
- `space-y-3` instead of `space-y-6`
- Category + Due Date in a 2-column grid
- Est. Hours + EisenhowerPicker in a 2-column grid
- Remove the separate Importance and Urgency button groups
- Use `space-y-1.5` for label-to-input spacing

The cancel/save buttons keep their existing `flex-col-reverse gap-3 md:flex-row md:justify-end` layout.

**Step 3: Verify it compiles**

Run: `npm run dev` and check the edit dialog still works
Expected: No errors, edit dialog shows compact layout

**Step 4: Commit**

```bash
git add components/task/edit-task-dialog.tsx
git commit -m "feat: apply compact grid layout to edit-task dialog"
```

---

### Task 4: Visual QA and polish

**Files:**
- Possibly touch: `components/task/add-task-form.tsx`, `components/task/eisenhower-picker.tsx`

**Step 1: Check mobile viewport (375px wide)**

Open browser dev tools, set viewport to 375px width. Verify:
- All fields are readable and tappable (min 44px touch targets)
- The 2-column grid doesn't feel cramped
- The EisenhowerPicker cells are big enough to tap
- Calendar popover doesn't overflow

**Step 2: Check desktop viewport**

Verify the dialog looks good at 480px max-width (the dialog's constraint).

**Step 3: Fix any spacing/alignment issues found**

Adjust Tailwind classes as needed.

**Step 4: Commit**

```bash
git add -A
git commit -m "fix: polish compact form spacing and mobile layout"
```

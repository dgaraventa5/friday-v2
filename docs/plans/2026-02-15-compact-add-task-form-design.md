# Compact Add Task Form Design

**Date**: 2026-02-15
**Status**: Approved

## Problem

The `AddTaskForm` is too tall — on both mobile and desktop, inputs take up too much vertical space and require scrolling. The form should fit on a single screen.

## Solution: Compact Grid Layout + Eisenhower Quadrant Picker

### Layout

```
┌─────────────────────────────────────┐
│  Add New Task                     X │
├─────────────────────────────────────┤
│  Task Name                          │
│  [What needs to be done?.........]  │
│                                     │
│  Category          Due Date         │
│  [Personal ▼]      [📅 Pick date]  │
│                                     │
│  Hours             Priority         │
│  [1.0    ]         ┌──────┬──────┐  │
│                    │Critic│ Plan │  │
│                    │al    │      │  │
│                    ├──────┼──────┤  │
│                    │Deleg │Back- │  │
│                    │ate   │log   │  │
│                    └──────┴──────┘  │
│                                     │
│  ▶ More options                     │
│                                     │
│  [Cancel]              [Add Task]   │
└─────────────────────────────────────┘
```

### Changes

1. **Category + Due Date** on a single row (2-column grid)
2. **Estimated Hours + Eisenhower Picker** on a single row
3. **Importance/Urgency toggle groups** replaced by a single 2×2 quadrant picker
4. **Spacing** reduced from `space-y-6` to `space-y-3` throughout
5. **Recurring section** keeps collapsible pattern, with tighter spacing (`space-y-3`)

### Eisenhower Quadrant Picker

Replaces the separate Importance and Urgency button groups with a 2×2 grid:

|              | Urgent         | Not Urgent    |
|--------------|----------------|---------------|
| **Important**    | Critical (Do First) | Plan (Schedule) |
| **Not Important**| Delegate (Quick Wins) | Backlog (Consider) |

Behavior:
- Tap any cell to select it (sets both `importance` and `urgency`)
- Selected cell gets quadrant color fill; others are outlined
- Colors match existing app palette:
  - Critical: red bg
  - Plan: blue bg
  - Delegate: amber bg
  - Backlog: slate bg

### What stays the same

- Task Name stays full-width
- Cancel/Add Task footer buttons
- All functionality (recurring tasks, validation, etc.)
- Dialog container (bottom sheet mobile, centered desktop)
- "More options" collapsible section for recurring settings

### Files to modify

- `components/task/add-task-form.tsx` — main restructure
- `components/dashboard/edit-task-dialog.tsx` — apply same compact layout for consistency (optional follow-up)

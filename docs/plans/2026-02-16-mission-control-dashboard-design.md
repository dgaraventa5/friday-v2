# Mission Control Dashboard Redesign

**Date**: 2026-02-16
**Status**: Approved

## Problem

The current dashboard feels generic — standard shadcn components, flat task list, no visible intelligence. The landing page promises "the to-do list that thinks for you" but the dashboard doesn't surface any of that thinking. The bottom nav wastes screen space. The overall experience lacks energy and personality.

## Design Direction

**Approach**: "Mission Control" — a gamified focus board that makes your day feel like a mission. Energizing momentum, smart priority transparency, mobile-first.

**Emotional target**: Nike Run Club meets Things 3 — bold confidence with warm restraint. Every completion feels like leveling up.

## Visual Identity

### Color System (Light Mode)

| Role | Color | Token |
|------|-------|-------|
| Background | `#FFFDF7` | Warm off-white (same as landing page) |
| Task tiles | `#FFFFFF` | White with warm border (`border-amber-100`), soft shadow |
| Accent / momentum | `#F59E0B` → `#FCD34D` | Amber-to-gold gradient |
| Text primary | `#1C1917` | Stone-950 |
| Text secondary | `#57534E` | Stone-600 |
| Q1 (urgent+important) | Red/coral | Left border accent |
| Q2 (important) | Blue-slate | Left border accent |
| Q3 (urgent) | Amber | Left border accent |
| Q4 (neither) | Muted gray | Left border accent |
| Success | `#4ADE80` | Warm sage-green for completions |

### Typography

- **Display/headings**: Bold geometric sans-serif (DM Sans 800 or Plus Jakarta Sans) — warm, confident
- **Body/task titles**: Same family at medium weight
- **Mono/data**: Clean monospace for numbers (priority scores, streaks, time estimates) — "mission readiness" feel

### Motion Philosophy

- Every completion is a **moment**: tile compresses, momentum bar pulses forward, brief particle spray in accent gold
- Page load: tiles stagger in from bottom with spring animation (50ms delay between each)
- View transitions: horizontal slide with slight scale
- All motion has `prefers-reduced-motion` fallbacks

## Layout

### Mobile (Primary)

```
+---------------------------------+
|  friday    [Today|Sched]   [av] |  Header with pill toggle
+---------------------------------+
|  [=========>        ] fire 3 2/4|  Momentum bar + streak
+---------------------------------+
|                                 |
|  +---------------------------+  |
|  | #1  Fix prod bug          |  |  Ranked tiles (all equal size)
|  |     Due tomorrow  [red]   |  |  with priority reason
|  +---------------------------+  |
|                                 |
|  +---------------------------+  |
|  | #2  Review PR             |  |
|  |     High impact   [blue]  |  |
|  +---------------------------+  |
|                                 |
|  +---------------------------+  |
|  | #3  Update docs           |  |
|  |     Aging 5 days  [gray]  |  |
|  +---------------------------+  |
|                                 |
|  +---------------------------+  |
|  | #4  Email client          |  |
|  |     Scheduled today [amb] |  |
|  +---------------------------+  |
|                                 |
|  + - - - - - - - - - - - - -+  |
|  | + Add a task...           |  |  Inline quick-add
|  + - - - - - - - - - - - - -+  |
|                                 |
|  -- Completed today (2) -----  |  Collapsible
|  Calendar / Reminders          |  Compact secondary section
|                                 |
+---------------------------------+
```

**No bottom nav. No FAB.** Maximum screen space for tasks.

### Desktop (>=1024px)

```
+------------------------------------------------------+
|  friday                              [Today|Sched] av|
+------------------------------------------------------+
|  [=========>               ] fire 3       2 of 4     |
+-----------------------------------+------------------+
|                                   |                  |
|  #1 +---------------------------+ | Calendar         |
|     | Fix prod bug              | | +--------------+ |
|     | Due tomorrow              | | | 10am Standup | |
|     +---------------------------+ | | 2pm Client   | |
|                                   | +--------------+ |
|  #2 +---------------------------+ |                  |
|     | Review PR                 | | Reminders        |
|     +---------------------------+ | +--------------+ |
|                                   | | Take vitamins| |
|  #3 +---------------------------+ | | Morning jog  | |
|     | Update docs               | | +--------------+ |
|     +---------------------------+ |                  |
|                                   | Week Activity    |
|  #4 +---------------------------+ | +--------------+ |
|     | Email client              | | | [sparkline]  | |
|     +---------------------------+ | +--------------+ |
|                                   |                  |
|  + Add a task...                  |                  |
|                                   |                  |
+-----------------------------------+------------------+
```

Main column for ranked tiles + quick-add. Sidebar for calendar, reminders, weekly activity.

## Navigation

- **Header pill toggle**: Segmented control (Today | Schedule) in the header
- **No bottom nav bar**: Eliminated to reclaim mobile screen space
- **No floating action button**: Inline quick-add replaces the FAB for task creation

## Task Tiles

### Default State (Collapsed)

Each tile displays:
- **Rank badge** (#1-#4): Small, bold, top-left
- **Task title**: Primary text, medium-bold weight
- **Priority reason**: One-line contextual explanation derived from the scoring algorithm's dominant factor:
  - "Due tomorrow" (deadline pressure dominant)
  - "Overdue by 2 days" (overdue tasks)
  - "High impact, aging 5 days" (importance + age)
  - "Urgent + Important" (Eisenhower quadrant dominant)
  - "Large task, deadline near" (duration pressure)
- **Quadrant accent**: Thin left border in quadrant color (red/amber/blue/gray)
- **Category chip**: Tiny pill (Work/Home/Health/Personal)
- **Checkbox**: Right side

### Expanded State (Tap to Expand)

Tapping a tile reveals:
- Full task description
- **Score breakdown**: Compact horizontal bars showing relative contribution of each scoring factor (base score, deadline, duration pressure, age). Visual, not numeric — users intuit "the deadline is why this is ranked high"
- Edit / Delete / Pin action icons
- Metadata: due date, estimated hours, recurring info

### Completion Interaction

1. Tap checkbox
2. Tile compresses with scale-down + fade animation
3. Momentum bar advances with gold pulse
4. If 5th task exists in backlog, it slides into #4 slot after 500ms delay

## Momentum Bar & Streak

### Momentum Bar
- Full-width horizontal bar below header
- Fills left-to-right: 0% → 25% → 50% → 75% → 100%
- Gradient fill: warm amber at leading edge → gold
- Animated shimmer on fill edge
- 100% completion: celebration pulse (bar glows, settles)

### Streak Display
- Right side of momentum bar row: flame icon + count
- Milestone animations at 7, 14, 30 days
- Reset handled gracefully: "Start a new streak today"

### Weekly Activity
- Desktop: sparkline in sidebar
- Mobile: accessible from avatar menu or stats section

## Schedule View

Toggling to "Schedule" via header pill shows a vertical timeline:

- **Overdue section** (if any): Red-tinted section at top
- **Today section** (pinned): Compact task rows (not full tiles) with quick-complete
- **Upcoming days**: Collapsible section headers showing date, task count, total hours
- **Visual timeline**: Thin vertical line on left connecting date sections with dots at date markers

## Quick-Add & Task Creation

### Inline Quick-Add
- Styled as dashed-border tile: "+ Add a task..."
- Tap to activate into text input, type title, Enter to create
- Task auto-scored and auto-scheduled by Friday
- If new task ranks into top 4, tiles re-rank with animation

### Full Task Form
- Expand icon next to quick-add opens full form as bottom sheet (mobile) / dialog (desktop)
- Same fields as current: title, description, importance, urgency, due date, estimated hours, category, recurring
- Styled to match new aesthetic

## Summary Table

| Element | Decision |
|---------|----------|
| Visual tone | Warm light mode, amber/gold energy, paper-like warmth |
| Typography | Bold geometric sans (DM Sans / Plus Jakarta Sans), monospace for data |
| Layout | Ranked tiles (equal size), momentum bar, no bottom nav |
| Navigation | Header pill toggle (Today / Schedule), no FAB |
| Priority transparency | One-line reason per tile, expandable score breakdown bars |
| Task creation | Inline quick-add, expandable to full bottom sheet |
| Completions | Compress + fade animation, momentum bar pulse, backfill |
| Streak | Flame counter in momentum row, milestone animations |
| Schedule view | Vertical timeline with collapsible day sections |
| Desktop | Sidebar for calendar/reminders/weekly activity |

## What's NOT Changing

- Core data model (tasks, profiles, Eisenhower matrix)
- Scoring algorithm (`task-prioritization.ts`)
- Scheduling algorithm (`scheduling/`)
- Service layer and Supabase integration
- Auth flow
- Recalibration modal system
- Settings pages

# Recalibration Redesign Design

**Date:** 2026-02-22
**Status:** Approved

## Problem

The recalibration modal feels cluttered and confusing. Every task card displays all controls simultaneously (date presets, importance/urgency toggles, keep-as-is button) creating a wall of buttons. The modal chrome (progress bar with percentage, colored section headers with icons and borders, three footer actions) adds visual noise on top of already dense cards.

## Design Decisions

- **Accordion cards**: Collapsed by default, expand on tap, one card open at a time
- **Mobile-first**: Bottom sheet via `dialog-sheet`, all layouts designed for 375px first
- **Lighter section headers**: Text label + count only, no colored backgrounds, borders, or icons
- **Simplified progress**: Replace progress bar with a "N tasks" counter in the dialog header
- **3 date presets**: Tomorrow / +3 Days / +1 Week (drop calendar picker)
- **Footer**: "Skip Today" + "Done" only, remove snooze link
- **Skip Today behavior**: Still marks the recalibration as dismissed for the day

## Component Changes

### RecalibrationModal

**Before:**
- Full progress bar with "Reviewed X of Y tasks" + percentage
- Snooze link in footer ("Remind me in 1 hour")
- Three footer actions (Skip Today, Done, Snooze)

**After:**
- Header shows "Daily Recalibration" + "N tasks" counter (e.g., "3 tasks")
- Footer: "Skip Today" (outline) + "Done" (primary) only
- Remove snooze functionality entirely
- Remove `onSnooze` prop

### RecalibrationSection

**Before:**
- Bordered container with colored header backgrounds (amber for overdue, slate for others)
- Icons per section (AlertTriangle, Calendar, CalendarClock)
- Chevron toggle icons

**After:**
- Lightweight text label + count, no container borders
- No background colors, no icons
- Tomorrow section still collapsible, but with a simple `▸`/`▾` toggle
- Use spacing (margin) instead of borders to separate sections

### RecalibrationTaskCard

**Before:**
- All controls visible at all times for every card
- 4 border-t dividers separating zones (header, dates, toggles, keep-as-is)
- Overflow menu always visible
- "Keep as-is" button in its own bordered section
- "Modified" indicator below all controls

**After (collapsed state):**
- Single compact row: checkbox + title + relative date badge
- Second row: category pill + estimate
- Blue dot indicator if card has unsaved modifications
- If date was changed, badge shows new date instead of "X days ago"

**After (expanded state):**
- Collapsed content stays visible at top
- Overflow menu (⋮) appears on expand
- "Reschedule:" label + 3 date preset buttons (Tomorrow / +3 Days / +1 Week)
- Importance/Urgency toggles (same compact Yes/No style)
- Quadrant label
- "Keep as-is" button at bottom (marks reviewed, collapses card)
- No border-t dividers between zones, just spacing

### Accordion Behavior

- Tapping a collapsed card expands it
- Expanding a card collapses any previously open card
- State tracked via `expandedTaskId` in the modal (single string, not a set)
- Making any change (date/importance/urgency) auto-marks the task as reviewed
- "Keep as-is" explicitly marks reviewed and collapses
- Completing via checkbox hides the card with a fade

### DatePresetButtons

**Before:**
- 4 buttons: Tomorrow, +2 Days, +1 Week, Pick (calendar)
- Calendar popover with full month picker

**After:**
- 3 buttons: Tomorrow, +3 Days, +1 Week
- No calendar picker
- Remove `Popover`, `PopoverContent`, `PopoverTrigger`, `Calendar` imports
- Simpler component with no internal state

### ImportanceUrgencyToggles

No functional changes. Keep the compact mode layout (label + Yes/No buttons + quadrant display).

## Files to Modify

1. `components/recalibration/recalibration-modal.tsx` - Accordion state, simplified header/footer
2. `components/recalibration/recalibration-task-card.tsx` - Collapsed/expanded states
3. `components/recalibration/recalibration-section.tsx` - Lighter headers
4. `components/recalibration/date-preset-buttons.tsx` - 3 presets, no calendar
5. `hooks/use-recalibration.ts` - Remove snooze, adjust state

## Files NOT Modified

- `components/recalibration/importance-urgency-toggles.tsx` - No changes needed
- `lib/utils/recalibration-utils.ts` - No changes needed (calculatePresetDate already supports the presets we need)

## What Gets Removed

1. Progress bar + percentage display
2. Snooze / "Remind me in 1 hour" functionality
3. Calendar date picker (Popover + Calendar component)
4. "+2 Days" preset (replaced with "+3 Days")
5. Colored section header backgrounds (amber/slate)
6. Section header icons (AlertTriangle, Calendar, CalendarClock)
7. Section border containers
8. Border-t dividers between card zones
9. Always-visible overflow menu on collapsed cards

## Visual Reference

### Mobile Bottom Sheet (collapsed cards)

```
┌─────────────────────────────────────┐
│  Daily Recalibration     3 tasks  ✕ │
│                                     │
│  OVERDUE  2                         │
│  ┌─────────────────────────────────┐│
│  │ ○  Finish Q4 report     2d ago ││
│  │    Work · 2h                   ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ ○  Call dentist          1d ago ││
│  │    Home                        ││
│  └─────────────────────────────────┘│
│                                     │
│  DUE TODAY  1                       │
│  ┌─────────────────────────────────┐│
│  │ ○  Review PR #234       Today  ││
│  │    Work · 1h                   ││
│  └─────────────────────────────────┘│
│                                     │
│  ▸ TOMORROW  4                      │
│                                     │
│  ─────────────────────────────────  │
│  [  Skip Today  ]  [    Done    ]   │
└─────────────────────────────────────┘
```

### Expanded Card

```
┌─────────────────────────────────────┐
│ ○  Finish Q4 report         2d ago │
│    Work · 2h                    ⋮   │
│                                     │
│  Reschedule:                        │
│  [ Tomorrow ] [ +3 Days ] [ +1 Wk ]│
│                                     │
│  Important? [ Yes ][ No ]           │
│  Urgent?    [ Yes ][ No ]           │
│  → Critical (Do First)             │
│                                     │
│  [ ✓ Keep as-is ]                   │
└─────────────────────────────────────┘
```

### Modified Collapsed Card

```
┌─────────────────────────────────────┐
│ ○  Finish Q4 report     → Tomorrow │
│    Work · 2h                  •     │
└─────────────────────────────────────┘
```

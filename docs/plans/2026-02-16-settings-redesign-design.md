# Settings Page Redesign — Design Document

**Date:** 2026-02-16
**Status:** Approved

## Problem

The settings page is utilitarian and visually disconnected from the dashboard's warm, polished aesthetic. It uses plain white boxes, spreadsheet-style grids of dropdowns, and lacks the butter-yellow accents, mc-card styling, and micro-interactions that define the Friday experience.

## Solution

Redesign the settings page with:
- **Sidebar navigation** (desktop) collapsing to **horizontal tabs** (mobile)
- **Slider-based controls** replacing dropdown selects
- Full visual alignment with the dashboard's design system (mc-card, warm colors, animations)

## Layout

### Desktop (md+)
```
┌──────────────────────────────────────────────┐
│  [←] Settings                                │ ← Sticky header
│       Task scheduling & calendar preferences │
├─────────────┬────────────────────────────────┤
│             │                                │
│ ⏰ Scheduling│   [Active Section Content]     │
│ 📊 Categories│                                │
│ 🔄 Recalib. │   mc-card styled panels        │
│ 📅 Calendars│   with sliders & controls      │
│             │                                │
│             │                                │
│ [  Save  ]  │                                │
│             │                                │
└─────────────┴────────────────────────────────┘
  240px fixed    Scrollable content
```

### Mobile (<md)
```
┌────────────────────────┐
│  [←] Settings          │ ← Sticky header
├────────────────────────┤
│ [Sched] [Cat] [Rec] [Cal] │ ← Horizontal tabs
├────────────────────────┤
│                        │
│  [Active Section]      │
│                        │
│  [Save Button]         │ ← Sticky bottom
└────────────────────────┘
```

## Navigation Sections

| # | Icon       | Label            | Content                                    |
|---|------------|------------------|--------------------------------------------|
| 1 | Clock      | Scheduling       | Daily max hours + daily max tasks (sliders)|
| 2 | BarChart3  | Category Limits  | Per-category weekday/weekend hour limits   |
| 3 | RefreshCw  | Recalibration    | Auto-prompt toggle, time, tomorrow toggle  |
| 4 | Calendar   | Calendars        | Connected calendar slots                   |

## Sidebar Design (Desktop)

- Fixed width: `w-60` (240px)
- Background: `bg-card` with `border-r`
- Full remaining viewport height below header

### Nav Items
- Layout: icon (20px) + label, `py-2.5 px-3`, `rounded-lg`
- **Active:** `bg-yellow-50 dark:bg-yellow-500/10`, left 3px border in `yellow-500`, text `stone-800 dark:text-slate-100`
- **Hover (inactive):** `bg-slate-50 dark:bg-slate-800/50`
- **Inactive:** `text-slate-500`, muted icon
- Transition: `transition-all duration-150 ease-out`

### Save Button
- Full-width at bottom of sidebar
- Primary yellow styling, `button-hover` utility

## Mobile Tab Bar

- Container: `bg-stone-100 dark:bg-slate-800` with `rounded-xl p-1`
- Horizontal scroll with `overflow-x-auto`, hidden scrollbar
- Each tab: icon + label in pill button
- **Active tab:** `bg-white dark:bg-slate-700` with `shadow-sm`
- **Inactive:** transparent, `text-slate-500`
- Sticky below header

## Slider Component

New component: `components/ui/slider.tsx` (Radix UI Slider)

### Visual Spec
- **Track:** `h-2 rounded-full bg-slate-200 dark:bg-slate-700`
- **Fill/Range:** `bg-gradient-to-r from-yellow-400 to-yellow-500` (matches momentum bar)
- **Thumb:** `w-5 h-5 rounded-full bg-white shadow-md border-2 border-yellow-500`
- **Thumb hover:** `scale(1.1)` with `shadow-lg`
- **Value display:** Mono-font badge right of slider: `bg-yellow-50 text-yellow-700 font-mono rounded-md px-2 py-0.5 text-sm`

### Category-colored variant
- Category sliders use category accent color for fill instead of yellow
- Work: purple, Home: green, Health: pink, Personal: cyan

## Content Sections

### All sections use mc-card wrapper:
```
border: 1px solid #FEF3C7 (amber-100)
border-radius: 0.75rem
box-shadow: warm amber shadow
hover: translateY(-1px) + enhanced shadow
```

### 1. Scheduling Section
- Header: Clock icon + "Daily Max Hours" + "Maximum total hours per day"
- Two slider rows (Weekday / Weekend) for max hours (range 0-10)
- Divider
- Header: ListChecks icon + "Daily Max Tasks" + "Maximum tasks scheduled per day"
- Two slider rows (Weekday / Weekend) for max tasks (range 0-10)

### 2. Category Limits Section
- Header: BarChart3 icon + "Category Limits" + "Max hours per day for each category"
- Each category rendered as a mini-card:
  - Left 3px border in category color
  - Category name + color indicator
  - Two compact sliders: Weekday / Weekend (range 0-10)
  - Category colors: Work=#8B5CF6, Home=#10B981, Health=#EC4899, Personal=#06B6D4

### 3. Recalibration Section
- Header: RefreshCw icon + "Daily Recalibration" + "End-of-day task review prompt"
- Toggle row: "Enable auto-prompt" with checkbox/switch
- Time row: "Trigger time" with time input (styled warm)
- Toggle row: "Include tomorrow's tasks" with checkbox
- Sub-options fade to 50% opacity + pointer-events-none when disabled

### 4. Calendars Section
- Wraps existing CalendarSettings component
- CalendarSlotCards get mc-card treatment
- All modals remain unchanged (they already have dialog-sheet styling)

## Save Behavior

- Desktop: Save button at bottom of sidebar
- Mobile: Sticky bottom bar with Save button
- Success: Green success message, then redirect to dashboard
- Error: Red error message
- Existing API call preserved (`POST /api/settings`)

## Animations

- Sidebar items: `transition-all duration-150 ease-out`
- Content sections: `animate-tile-enter` on mount (fade-up with spring)
- Slider fill: CSS transition on width
- Save button: `button-hover` utility
- Section switch: fade transition between sections

## New Files

1. `components/ui/slider.tsx` — Radix UI Slider, styled per spec
2. `components/settings/settings-sidebar.tsx` — Sidebar + mobile tabs navigation
3. `components/settings/settings-layout.tsx` — Client component orchestrating sidebar, sections, save
4. `components/settings/scheduling-section.tsx` — Max hours + max tasks sliders
5. `components/settings/category-limits-section.tsx` — Per-category sliders
6. `components/settings/recalibration-section.tsx` — Toggle + time + tomorrow

## Modified Files

1. `app/settings/page.tsx` — Use new layout, pass data to client component
2. `components/settings/settings-form.tsx` — Remove (replaced by individual sections)
3. `components/settings/calendar-settings.tsx` — Minor styling updates (mc-card wrapper)

## Dependencies

- `@radix-ui/react-slider` — for Slider primitive

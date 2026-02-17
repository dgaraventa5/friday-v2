# Settings Page Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the settings page with sidebar navigation (desktop) / horizontal tabs (mobile), slider-based controls, and full visual alignment with the dashboard's warm Friday aesthetic.

**Architecture:** The settings page becomes a client-side layout component (`SettingsLayout`) that manages active section state and renders a sidebar (desktop) or tab bar (mobile) alongside the active section content. Individual sections are extracted into focused components. A new Radix UI Slider component provides warm-styled range inputs. The existing API route (`POST /api/settings`) and data flow are preserved unchanged.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Radix UI (`@radix-ui/react-slider` already installed), Lucide icons, existing Friday design system (mc-card, butter yellow, spring animations).

**Design doc:** `docs/plans/2026-02-16-settings-redesign-design.md`

---

### Task 1: Create Slider UI Component

**Files:**
- Create: `components/ui/slider.tsx`

**Context:** `@radix-ui/react-slider` is already installed at v1.2.2. Follow the same pattern as `components/ui/checkbox.tsx` — import Radix primitives, style with `cn()` utility, export named component. The slider needs to support an optional `accentColor` prop for category-colored fills.

**Step 1: Create the Slider component**

Create `components/ui/slider.tsx`:

```tsx
'use client'

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

interface SliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  accentColor?: string
}

function Slider({ className, accentColor, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            'absolute h-full rounded-full',
            !accentColor && 'bg-gradient-to-r from-yellow-400 to-yellow-500',
          )}
          style={accentColor ? { backgroundColor: accentColor } : undefined}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        className={cn(
          'block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-150 ease-out',
          'hover:scale-110 hover:shadow-lg',
          'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-yellow-500/50',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
        style={{
          borderWidth: 2,
          borderStyle: 'solid',
          borderColor: accentColor || '#FDE047',
        }}
      />
    </SliderPrimitive.Root>
  )
}

export { Slider }
```

**Step 2: Verify it builds**

Run: `npm run build 2>&1 | head -20` (or `npm run dev` and check no errors)

**Step 3: Commit**

```bash
git add components/ui/slider.tsx
git commit -m "feat: add Slider UI component with warm yellow styling"
```

---

### Task 2: Create Scheduling Section Component

**Files:**
- Create: `components/settings/scheduling-section.tsx`

**Context:** This replaces the "Daily Max Hours" and "Daily Max Tasks" dropdowns from `settings-form.tsx` with sliders. It receives state and setters as props (lifted state pattern — the parent layout component owns all settings state). Uses the mc-card styling (`mc-card` CSS class from `globals.css`), Lucide icons (`Clock`, `ListChecks`), and the new `Slider` component.

**Step 1: Create the component**

Create `components/settings/scheduling-section.tsx`:

```tsx
'use client'

import { Clock, ListChecks } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import type { DailyMaxHours, DailyMaxTasks } from '@/lib/types'

interface SchedulingSectionProps {
  dailyMaxHours: DailyMaxHours
  dailyMaxTasks: DailyMaxTasks
  onMaxHoursChange: (type: 'weekday' | 'weekend', value: number) => void
  onMaxTasksChange: (type: 'weekday' | 'weekend', value: number) => void
}

function SliderRow({
  label,
  value,
  max,
  onChange,
  accentColor,
}: {
  label: string
  value: number
  max: number
  onChange: (value: number) => void
  accentColor?: string
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-slate-600 dark:text-slate-400 w-20 shrink-0">
        {label}
      </span>
      <Slider
        value={[value]}
        min={0}
        max={max}
        step={1}
        onValueChange={([v]) => onChange(v)}
        accentColor={accentColor}
        className="flex-1"
      />
      <span className="bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 font-mono rounded-md px-2 py-0.5 text-sm min-w-[2.5rem] text-center">
        {value}
      </span>
    </div>
  )
}

export function SchedulingSection({
  dailyMaxHours,
  dailyMaxTasks,
  onMaxHoursChange,
  onMaxTasksChange,
}: SchedulingSectionProps) {
  return (
    <div className="space-y-6 animate-tile-enter">
      {/* Daily Max Hours */}
      <div className="mc-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Daily Max Hours
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Maximum total hours per day across all categories
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <SliderRow
            label="Weekday"
            value={dailyMaxHours.weekday}
            max={10}
            onChange={(v) => onMaxHoursChange('weekday', v)}
          />
          <SliderRow
            label="Weekend"
            value={dailyMaxHours.weekend}
            max={10}
            onChange={(v) => onMaxHoursChange('weekend', v)}
          />
        </div>
      </div>

      {/* Daily Max Tasks */}
      <div className="mc-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center">
            <ListChecks className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Daily Max Tasks
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Maximum number of tasks scheduled per day
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <SliderRow
            label="Weekday"
            value={dailyMaxTasks.weekday}
            max={10}
            onChange={(v) => onMaxTasksChange('weekday', v)}
          />
          <SliderRow
            label="Weekend"
            value={dailyMaxTasks.weekend}
            max={10}
            onChange={(v) => onMaxTasksChange('weekend', v)}
          />
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify it builds**

Run: `npm run build 2>&1 | head -20`

**Step 3: Commit**

```bash
git add components/settings/scheduling-section.tsx
git commit -m "feat: add SchedulingSection with slider controls"
```

---

### Task 3: Create Category Limits Section Component

**Files:**
- Create: `components/settings/category-limits-section.tsx`

**Context:** Replaces the spreadsheet-style grid of selects. Each category gets its own mini-card with a left border in its accent color and two sliders (weekday/weekend). Category colors: Work=#8B5CF6 (purple), Home=#10B981 (green), Health=#EC4899 (pink), Personal=#06B6D4 (cyan).

**Step 1: Create the component**

Create `components/settings/category-limits-section.tsx`:

```tsx
'use client'

import { BarChart3 } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import type { CategoryLimits } from '@/lib/types'

interface CategoryLimitsSectionProps {
  categoryLimits: CategoryLimits
  onCategoryLimitChange: (
    category: keyof CategoryLimits,
    type: 'weekday' | 'weekend',
    value: number,
  ) => void
}

const CATEGORY_CONFIG: {
  key: keyof CategoryLimits
  label: string
  color: string
}[] = [
  { key: 'Work', label: 'Work', color: '#8B5CF6' },
  { key: 'Home', label: 'Home', color: '#10B981' },
  { key: 'Health', label: 'Health', color: '#EC4899' },
  { key: 'Personal', label: 'Personal', color: '#06B6D4' },
]

export function CategoryLimitsSection({
  categoryLimits,
  onCategoryLimitChange,
}: CategoryLimitsSectionProps) {
  return (
    <div className="space-y-6 animate-tile-enter">
      <div className="mc-card p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Category Limits
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Maximum hours per day for each category
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {CATEGORY_CONFIG.map(({ key, label, color }) => (
            <div
              key={key}
              className="rounded-lg border border-border bg-card p-4"
              style={{ borderLeftWidth: 3, borderLeftColor: color }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {label}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-16 shrink-0">
                    Weekday
                  </span>
                  <Slider
                    value={[categoryLimits[key].weekday]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={([v]) =>
                      onCategoryLimitChange(key, 'weekday', v)
                    }
                    accentColor={color}
                    className="flex-1"
                  />
                  <span
                    className="font-mono rounded-md px-2 py-0.5 text-xs min-w-[2rem] text-center"
                    style={{
                      backgroundColor: `${color}15`,
                      color: color,
                    }}
                  >
                    {categoryLimits[key].weekday}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-16 shrink-0">
                    Weekend
                  </span>
                  <Slider
                    value={[categoryLimits[key].weekend]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={([v]) =>
                      onCategoryLimitChange(key, 'weekend', v)
                    }
                    accentColor={color}
                    className="flex-1"
                  />
                  <span
                    className="font-mono rounded-md px-2 py-0.5 text-xs min-w-[2rem] text-center"
                    style={{
                      backgroundColor: `${color}15`,
                      color: color,
                    }}
                  >
                    {categoryLimits[key].weekend}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify it builds**

Run: `npm run build 2>&1 | head -20`

**Step 3: Commit**

```bash
git add components/settings/category-limits-section.tsx
git commit -m "feat: add CategoryLimitsSection with color-coded slider cards"
```

---

### Task 4: Create Recalibration Section Component

**Files:**
- Create: `components/settings/recalibration-section.tsx`

**Context:** Extracts the recalibration settings from `settings-form.tsx`. Uses existing `Checkbox` and `Input` components, wrapped in mc-card styling. Sub-controls fade when disabled.

**Step 1: Create the component**

Create `components/settings/recalibration-section.tsx`:

```tsx
'use client'

import { RefreshCw } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RecalibrationSectionProps {
  enabled: boolean
  time: string
  includeTomorrow: boolean
  onEnabledChange: (enabled: boolean) => void
  onTimeChange: (time: string) => void
  onIncludeTomorrowChange: (include: boolean) => void
}

export function RecalibrationSection({
  enabled,
  time,
  includeTomorrow,
  onEnabledChange,
  onTimeChange,
  onIncludeTomorrowChange,
}: RecalibrationSectionProps) {
  return (
    <div className="space-y-6 animate-tile-enter">
      <div className="mc-card p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Daily Recalibration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              End-of-day task review prompt settings
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <Label
              htmlFor="recalibration-enabled"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Enable auto-prompt
            </Label>
            <Checkbox
              id="recalibration-enabled"
              checked={enabled}
              onCheckedChange={(checked) => onEnabledChange(checked === true)}
            />
          </div>

          {/* Sub-options that fade when disabled */}
          <div
            className={`space-y-4 transition-opacity duration-200 ${
              !enabled ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {/* Time picker */}
            <div className="flex items-center justify-between">
              <Label
                htmlFor="recalibration-time"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Trigger time
              </Label>
              <Input
                id="recalibration-time"
                type="time"
                value={time}
                onChange={(e) => onTimeChange(e.target.value)}
                className="w-32 h-8"
              />
            </div>

            {/* Include tomorrow toggle */}
            <div className="flex items-center justify-between">
              <Label
                htmlFor="recalibration-tomorrow"
                className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Include tomorrow&apos;s tasks
              </Label>
              <Checkbox
                id="recalibration-tomorrow"
                checked={includeTomorrow}
                onCheckedChange={(checked) =>
                  onIncludeTomorrowChange(checked === true)
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify it builds**

Run: `npm run build 2>&1 | head -20`

**Step 3: Commit**

```bash
git add components/settings/recalibration-section.tsx
git commit -m "feat: add RecalibrationSection with mc-card styling"
```

---

### Task 5: Create Settings Layout (Sidebar + Tabs + Orchestration)

**Files:**
- Create: `components/settings/settings-layout.tsx`

**Context:** This is the main client component that orchestrates all settings UI. It manages:
1. Active section state (`scheduling` | `categories` | `recalibration` | `calendars`)
2. All form state (lifted from the old `settings-form.tsx`)
3. Save handler (existing `POST /api/settings` call)
4. Sidebar (desktop) and tab bar (mobile) rendering
5. Rendering the active section content

It receives initial data from the server component page and calendar connections for the CalendarSettings component.

**Step 1: Create the layout component**

Create `components/settings/settings-layout.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Clock,
  BarChart3,
  RefreshCw,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SchedulingSection } from './scheduling-section'
import { CategoryLimitsSection } from './category-limits-section'
import { RecalibrationSection } from './recalibration-section'
import { CalendarSettings } from './calendar-settings'
import type {
  CategoryLimits,
  DailyMaxHours,
  DailyMaxTasks,
  ConnectedCalendar,
} from '@/lib/types'

type SettingsSection = 'scheduling' | 'categories' | 'recalibration' | 'calendars'

const NAV_ITEMS: {
  id: SettingsSection
  label: string
  icon: typeof Clock
}[] = [
  { id: 'scheduling', label: 'Scheduling', icon: Clock },
  { id: 'categories', label: 'Categories', icon: BarChart3 },
  { id: 'recalibration', label: 'Recalibration', icon: RefreshCw },
  { id: 'calendars', label: 'Calendars', icon: Calendar },
]

interface SettingsLayoutProps {
  initialCategoryLimits: CategoryLimits
  initialDailyMaxHours: DailyMaxHours
  initialDailyMaxTasks: DailyMaxTasks
  initialRecalibrationEnabled: boolean
  initialRecalibrationTime: string
  initialRecalibrationIncludeTomorrow: boolean
  calendarConnections: ConnectedCalendar[]
}

export function SettingsLayout({
  initialCategoryLimits,
  initialDailyMaxHours,
  initialDailyMaxTasks,
  initialRecalibrationEnabled,
  initialRecalibrationTime,
  initialRecalibrationIncludeTomorrow,
  calendarConnections,
}: SettingsLayoutProps) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<SettingsSection>('scheduling')

  // Form state
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimits>(initialCategoryLimits)
  const [dailyMaxHours, setDailyMaxHours] = useState<DailyMaxHours>(initialDailyMaxHours)
  const [dailyMaxTasks, setDailyMaxTasks] = useState<DailyMaxTasks>(initialDailyMaxTasks)
  const [recalibrationEnabled, setRecalibrationEnabled] = useState(initialRecalibrationEnabled)
  const [recalibrationTime, setRecalibrationTime] = useState(initialRecalibrationTime)
  const [recalibrationIncludeTomorrow, setRecalibrationIncludeTomorrow] = useState(
    initialRecalibrationIncludeTomorrow,
  )

  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleCategoryLimitChange = (
    category: keyof CategoryLimits,
    type: 'weekday' | 'weekend',
    value: number,
  ) => {
    setCategoryLimits((prev) => ({
      ...prev,
      [category]: { ...prev[category], [type]: value },
    }))
  }

  const handleMaxHoursChange = (type: 'weekday' | 'weekend', value: number) => {
    setDailyMaxHours((prev) => ({ ...prev, [type]: value }))
  }

  const handleMaxTasksChange = (type: 'weekday' | 'weekend', value: number) => {
    setDailyMaxTasks((prev) => ({ ...prev, [type]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_limits: categoryLimits,
          daily_max_hours: dailyMaxHours,
          daily_max_tasks: dailyMaxTasks,
          recalibration_enabled: recalibrationEnabled,
          recalibration_time: recalibrationTime,
          recalibration_include_tomorrow: recalibrationIncludeTomorrow,
        }),
      })

      if (!response.ok) throw new Error('Failed to save settings')

      setMessage({ type: 'success', text: 'Settings saved! Redirecting...' })
      router.refresh()
      setTimeout(() => {
        router.push(`/dashboard?updated=${Date.now()}`)
      }, 1000)
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'scheduling':
        return (
          <SchedulingSection
            dailyMaxHours={dailyMaxHours}
            dailyMaxTasks={dailyMaxTasks}
            onMaxHoursChange={handleMaxHoursChange}
            onMaxTasksChange={handleMaxTasksChange}
          />
        )
      case 'categories':
        return (
          <CategoryLimitsSection
            categoryLimits={categoryLimits}
            onCategoryLimitChange={handleCategoryLimitChange}
          />
        )
      case 'recalibration':
        return (
          <RecalibrationSection
            enabled={recalibrationEnabled}
            time={recalibrationTime}
            includeTomorrow={recalibrationIncludeTomorrow}
            onEnabledChange={setRecalibrationEnabled}
            onTimeChange={setRecalibrationTime}
            onIncludeTomorrowChange={setRecalibrationIncludeTomorrow}
          />
        )
      case 'calendars':
        return (
          <div className="animate-tile-enter">
            <CalendarSettings initialConnections={calendarConnections} />
          </div>
        )
    }
  }

  const SaveButton = ({ className }: { className?: string }) => (
    <Button
      onClick={handleSave}
      disabled={isSaving}
      className={className}
    >
      {isSaving ? 'Saving...' : 'Save Changes'}
    </Button>
  )

  return (
    <>
      {/* Status message */}
      {message && (
        <div
          className={`mx-4 md:mx-0 mt-3 p-3 rounded-lg border text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Mobile Tab Bar */}
      <div className="md:hidden sticky top-0 z-30 bg-background px-4 py-3">
        <div className="bg-stone-100 dark:bg-slate-800 rounded-xl p-1 flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ease-out ${
                activeSection === id
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: Sidebar + Content | Mobile: Content only */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card shrink-0">
          <nav className="flex-1 p-3 space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-150 ease-out ${
                  activeSection === id
                    ? 'bg-yellow-50 dark:bg-yellow-500/10 text-stone-800 dark:text-slate-100 border-l-[3px] border-l-yellow-500 pl-[9px]'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-border">
            <SaveButton className="w-full" />
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-2xl">
            {renderSection()}
          </div>
        </main>
      </div>

      {/* Mobile Save Bar */}
      <div className="md:hidden sticky bottom-0 bg-card border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <SaveButton className="w-full" />
      </div>
    </>
  )
}
```

**Step 2: Verify it builds**

Run: `npm run build 2>&1 | head -30`

**Step 3: Commit**

```bash
git add components/settings/settings-layout.tsx
git commit -m "feat: add SettingsLayout with sidebar nav and mobile tabs"
```

---

### Task 6: Update Settings Page & Clean Up

**Files:**
- Modify: `app/settings/page.tsx`
- Delete: `components/settings/settings-form.tsx` (replaced by section components + layout)

**Context:** The server component page.tsx needs to pass data to the new `SettingsLayout` client component instead of the old `SettingsForm` and separate `CalendarSettings`. The overall page structure changes to a full-height flex column layout.

**Step 1: Rewrite the settings page**

Replace the content of `app/settings/page.tsx` with:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createProfileService, createCalendarService } from "@/lib/services";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  const profileService = createProfileService(supabase);
  const result = await profileService.getProfile(data.user.id);

  if (result.error || !result.data) {
    redirect("/dashboard");
  }

  const profile = result.data;

  // Fetch calendar connections
  const calendarService = createCalendarService(supabase);
  const calendarResult = await calendarService.getConnectionsByUserId(data.user.id);
  const calendarConnections = calendarResult.data || [];

  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card shrink-0">
        <div className="px-4 md:px-6 py-2">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Settings
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Task scheduling & calendar preferences
              </p>
            </div>
          </div>
        </div>
      </header>

      <SettingsLayout
        initialCategoryLimits={profile.category_limits}
        initialDailyMaxHours={profile.daily_max_hours}
        initialDailyMaxTasks={profile.daily_max_tasks || { weekday: 4, weekend: 4 }}
        initialRecalibrationEnabled={profile.recalibration_enabled ?? true}
        initialRecalibrationTime={profile.recalibration_time?.slice(0, 5) || '17:00'}
        initialRecalibrationIncludeTomorrow={profile.recalibration_include_tomorrow ?? true}
        calendarConnections={calendarConnections}
      />
    </div>
  );
}
```

**Step 2: Delete the old settings-form.tsx**

```bash
rm components/settings/settings-form.tsx
```

**Step 3: Verify nothing imports the old file**

Run: `grep -r "settings-form" --include="*.tsx" --include="*.ts" .`
Expected: No results (the only import was in `app/settings/page.tsx` which we just replaced)

**Step 4: Verify it builds**

Run: `npm run build 2>&1 | tail -10`
Expected: Build succeeds with no errors

**Step 5: Commit**

```bash
git add app/settings/page.tsx
git rm components/settings/settings-form.tsx
git commit -m "feat: wire up new settings layout and remove old settings form"
```

---

### Task 7: Style Calendar Settings with mc-card

**Files:**
- Modify: `components/settings/calendar-settings.tsx` (lines 228-312, the JSX return)
- Modify: `components/settings/calendar-slot-card.tsx` (line 54, the container div)

**Context:** The CalendarSettings section needs a mc-card wrapper and the slot cards need warmer styling. These are minor CSS-level changes — no logic changes.

**Step 1: Add mc-card wrapper to CalendarSettings**

In `components/settings/calendar-settings.tsx`, wrap the return JSX in a mc-card container. Change:

```tsx
    <div className="space-y-4">
```

to:

```tsx
    <div className="mc-card p-5 space-y-4">
```

**Step 2: Update CalendarSlotCard styling**

In `components/settings/calendar-slot-card.tsx`, change the outer container (line 54):

```tsx
    <div className="p-3 border border-border rounded-lg bg-card">
```

to:

```tsx
    <div className="p-3 border border-yellow-100 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800/50 transition-all duration-150 hover:shadow-sm">
```

**Step 3: Verify it builds and looks right**

Run: `npm run build 2>&1 | tail -10`

**Step 4: Commit**

```bash
git add components/settings/calendar-settings.tsx components/settings/calendar-slot-card.tsx
git commit -m "style: apply mc-card warm styling to calendar settings"
```

---

### Task 8: Visual QA & Final Polish

**Files:** Any files from Tasks 1-7 that need adjustment

**Context:** Run the dev server, visit `/settings`, and check:

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Manual QA checklist**

Check each item in the browser at `http://localhost:3000/settings`:

- [ ] Desktop sidebar shows 4 nav items with icons
- [ ] Active nav item has yellow-50 background and yellow left border
- [ ] Clicking nav items switches content with fade animation
- [ ] Sliders work and show value in mono badge
- [ ] Category sliders use correct accent colors (purple, green, pink, cyan)
- [ ] Recalibration sub-options fade when toggle is off
- [ ] Calendar section renders existing connections
- [ ] Save button at bottom of sidebar (desktop)
- [ ] Resize to mobile: sidebar collapses to horizontal tab bar
- [ ] Mobile tab bar has stone-100 background and pill selection
- [ ] Mobile save button sticks to bottom with safe-area padding
- [ ] Dark mode: all sections render correctly (toggle via system prefs or class)
- [ ] Save actually persists (click save, verify redirect to dashboard)

**Step 3: Fix any visual issues**

Apply any spacing/color/alignment tweaks discovered during QA.

**Step 4: Final build check**

Run: `npm run build`
Expected: Clean build, no errors

**Step 5: Commit any polish fixes**

```bash
git add -A
git commit -m "style: visual polish for settings redesign"
```

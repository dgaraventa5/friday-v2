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
          className={`mx-4 md:mx-0 md:px-6 mt-3 p-3 rounded-lg border text-sm ${
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

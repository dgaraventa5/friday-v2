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

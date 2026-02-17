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
          <div className="w-9 h-9 rounded-lg bg-yellow-100 dark:bg-yellow-500/15 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />
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
              className="overflow-hidden border border-border bg-card p-4"
              style={{ borderLeftWidth: 3, borderLeftColor: color, borderRadius: '0 0.5rem 0.5rem 0' }}
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
                  <span className="text-sm text-slate-600 dark:text-slate-400 w-20 shrink-0">
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
                    className="font-mono font-semibold rounded-md px-2 py-0.5 text-xs min-w-[2rem] text-center bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    {categoryLimits[key].weekday}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600 dark:text-slate-400 w-20 shrink-0">
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
                    className="font-mono font-semibold rounded-md px-2 py-0.5 text-xs min-w-[2rem] text-center bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
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

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

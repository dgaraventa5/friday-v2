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
          <div className="w-9 h-9 rounded-lg bg-yellow-100 dark:bg-yellow-500/15 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />
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

        <div className="divide-y divide-border">
          {/* Enable toggle */}
          <div className="flex items-center justify-between py-3 first:pt-0">
            <div>
              <Label
                htmlFor="recalibration-enabled"
                className="text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Enable auto-prompt
              </Label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Get a daily review prompt at a set time
              </p>
            </div>
            <Checkbox
              id="recalibration-enabled"
              checked={enabled}
              onCheckedChange={(checked) => onEnabledChange(checked === true)}
            />
          </div>

          {/* Sub-options that fade when disabled */}
          <div
            className={`transition-opacity duration-200 ${
              !enabled ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            {/* Time picker */}
            <div className="flex items-center justify-between py-3">
              <div>
                <Label
                  htmlFor="recalibration-time"
                  className="text-sm font-medium text-slate-800 dark:text-slate-200"
                >
                  Trigger time
                </Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  When the review prompt appears
                </p>
              </div>
              <Input
                id="recalibration-time"
                type="time"
                value={time}
                onChange={(e) => onTimeChange(e.target.value)}
                className="w-28 h-8 min-h-0 text-sm px-2 py-1"
              />
            </div>

            {/* Include tomorrow toggle */}
            <div className="flex items-center justify-between py-3 border-t border-border">
              <div>
                <Label
                  htmlFor="recalibration-tomorrow"
                  className="text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Include tomorrow&apos;s tasks
                </Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Preview and adjust upcoming tasks too
                </p>
              </div>
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

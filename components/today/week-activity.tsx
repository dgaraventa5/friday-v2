'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getWeekDayLabels } from '@/lib/utils/stats-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WeekActivityProps {
  data: number[];           // 7 numbers, oldest to newest (ending with today)
  highlightToday?: boolean; // Highlight the last bar (default: true)
  showLabels?: boolean;     // Show M T W T F S S (default: true)
  className?: string;
}

export function WeekActivity({
  data,
  highlightToday = true,
  showLabels = true,
  className,
}: WeekActivityProps) {
  const dayLabels = useMemo(() => getWeekDayLabels(), []);

  // Normalize data to 7 items
  const normalizedData = useMemo(() => {
    if (data.length === 7) return data;
    if (data.length < 7) {
      // Pad with zeros at the beginning
      return [...Array(7 - data.length).fill(0), ...data];
    }
    // Take last 7 items
    return data.slice(-7);
  }, [data]);

  // Calculate max value for scaling (minimum 1 to avoid division by zero)
  const maxValue = useMemo(() => Math.max(...normalizedData, 1), [normalizedData]);

  // Full day names for tooltips
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getDayName = (index: number): string => {
    const today = new Date();
    const daysAgo = 6 - index;
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    return fullDayNames[date.getDay()];
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn('flex flex-col items-center gap-1', className)}>
        {/* Bars */}
        <div
          className="flex items-end gap-[3px]"
          style={{ height: '24px' }}
          role="img"
          aria-label={`Weekly activity: ${normalizedData.map((v, i) => `${getDayName(i)}: ${v} tasks`).join(', ')}`}
        >
          {normalizedData.map((value, index) => {
            const isToday = index === 6;
            const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const minHeight = value > 0 ? 4 : 2; // Show at least 2px even for 0

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'w-[6px] rounded-sm transition-all duration-300 cursor-default',
                      highlightToday && isToday
                        ? 'bg-blue-500'
                        : 'bg-slate-300 dark:bg-slate-600'
                    )}
                    style={{
                      height: `${Math.max(heightPercent, minHeight)}%`,
                      minHeight: `${minHeight}px`,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {getDayName(index)}: {value} task{value !== 1 ? 's' : ''}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Day labels */}
        {showLabels && (
          <div className="flex gap-[3px]">
            {dayLabels.map((label, index) => {
              const isToday = index === 6;
              return (
                <span
                  key={index}
                  className={cn(
                    'w-[6px] text-center text-[8px] leading-none',
                    highlightToday && isToday
                      ? 'text-blue-500 font-medium'
                      : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

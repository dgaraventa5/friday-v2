'use client';

import { useMemo } from 'react';
import { WeekActivity } from './week-activity';
import { cn } from '@/lib/utils';
import { getMotivationalText } from '@/lib/utils/stats-utils';
import { Flame } from 'lucide-react';

interface ProgressDockProps {
  completedCount: number;
  totalCount: number;
  streak: number;
  weeklyTrend: number[];
  remainingMinutes: number;
  className?: string;
}

export function ProgressDock({
  completedCount,
  totalCount,
  streak,
  weeklyTrend,
  remainingMinutes,
  className,
}: ProgressDockProps) {
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allComplete = totalCount > 0 && completedCount === totalCount;
  const circumference = 2 * Math.PI * 36;

  const motivationalText = useMemo(
    () => getMotivationalText(completedCount, totalCount, streak),
    [completedCount, totalCount, streak]
  );

  const timeText = useMemo(() => {
    if (remainingMinutes <= 0 || allComplete) {
      return null;
    }
    if (remainingMinutes < 60) {
      return `~${remainingMinutes}min left`;
    }
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    if (mins <= 10) {
      return `~${hours}h left`;
    }
    return `~${hours}h ${mins}m left`;
  }, [remainingMinutes, allComplete]);

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Progress Circle */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="5"
              fill="none"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="5"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              className={cn(
                'transition-all duration-500 ease-out',
                allComplete ? 'text-green-500' : 'text-blue-500'
              )}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {completedCount}/{totalCount}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {motivationalText}
          </p>
          {timeText && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {timeText}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          {/* Streak */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Flame
                className={cn(
                  'h-4 w-4',
                  streak > 0
                    ? 'text-orange-500'
                    : 'text-slate-400 dark:text-slate-600'
                )}
              />
              <span
                className={cn(
                  'text-base font-semibold',
                  streak > 0
                    ? 'text-slate-900 dark:text-slate-100'
                    : 'text-slate-400 dark:text-slate-500'
                )}
              >
                {streak}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">streak</span>
          </div>

          {/* Weekly Activity */}
          <WeekActivity data={weeklyTrend} />
        </div>
      </div>
    </div>
  );
}

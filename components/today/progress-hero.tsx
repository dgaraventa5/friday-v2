'use client';

import { useMemo } from 'react';
import { WeekActivity } from './week-activity';
import { cn } from '@/lib/utils';
import { getMotivationalText } from '@/lib/utils/stats-utils';
import { Flame } from 'lucide-react';

interface ProgressHeroProps {
  completedCount: number;
  totalCount: number;
  streak: number;
  weeklyTrend: number[];
  remainingMinutes: number;
  className?: string;
}

export function ProgressHero({
  completedCount,
  totalCount,
  streak,
  weeklyTrend,
  remainingMinutes,
  className,
}: ProgressHeroProps) {
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const circumference = 2 * Math.PI * 38; // r = 38

  const motivationalText = useMemo(
    () => getMotivationalText(completedCount, totalCount, streak),
    [completedCount, totalCount, streak]
  );

  const timeText = useMemo(() => {
    if (remainingMinutes <= 0 || completedCount === totalCount) {
      return null;
    }
    if (remainingMinutes < 60) {
      return `~${remainingMinutes}min left`;
    }
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    if (mins === 0) {
      return `~${hours}h left`;
    }
    return `~${hours}h ${mins}m left`;
  }, [remainingMinutes, completedCount, totalCount]);

  return (
    <div
      className={cn(
        'progress-hero-gradient rounded-xl border border-slate-200 p-4 sm:p-5 shadow-elevated dark:border-slate-700',
        className
      )}
    >
      <div className="flex items-center justify-between">
        {/* Progress Circle */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="h-16 w-16 sm:h-24 sm:w-24 -rotate-90 transform" viewBox="0 0 88 88">
            {/* Background circle */}
            <circle
              cx="44"
              cy="44"
              r="38"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-slate-200 dark:text-slate-700"
            />
            {/* Progress circle */}
            <circle
              cx="44"
              cy="44"
              r="38"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
              className={cn(
                'transition-all duration-500 ease-out',
                progress === 100
                  ? 'text-green-500'
                  : 'text-blue-500'
              )}
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {completedCount}/{totalCount}
            </span>
          </div>
        </div>

        {/* Motivational text and time */}
        <div className="shrink-0 text-center">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {motivationalText}
          </p>
          {timeText && (
            <p className="text-xs text-muted-foreground mt-1">
              {timeText}
            </p>
          )}
        </div>

        {/* Streak and Weekly Activity */}
        <div className="flex items-center justify-center gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <Flame
              className={cn(
                'h-5 w-5',
                streak > 0
                  ? 'text-orange-500'
                  : 'text-slate-400 dark:text-slate-600'
              )}
            />
            <span
              className={cn(
                'text-base font-semibold',
                streak > 0
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              {streak}
            </span>
          </div>

          <WeekActivity data={weeklyTrend} />
        </div>
      </div>
    </div>
  );
}

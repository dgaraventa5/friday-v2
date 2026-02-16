'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getMotivationalText } from '@/lib/utils/stats-utils';
import { Flame } from 'lucide-react';

interface MomentumBarProps {
  completedCount: number;
  totalCount: number;
  streak: number;
  className?: string;
}

export function MomentumBar({
  completedCount,
  totalCount,
  streak,
  className,
}: MomentumBarProps) {
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isComplete = totalCount > 0 && completedCount >= totalCount;

  const motivationalText = useMemo(
    () => getMotivationalText(completedCount, totalCount, streak),
    [completedCount, totalCount, streak]
  );

  return (
    <div className={cn('px-4 py-3 sm:px-6', className)}>
      {/* Top row: motivational text + streak + count */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-stone-600 dark:text-slate-400" style={{ fontFamily: 'var(--font-display)' }}>
          {motivationalText}
        </span>
        <div className="flex items-center gap-3">
          {/* Streak */}
          <div className="flex items-center gap-1">
            <Flame
              className={cn(
                'h-4 w-4',
                streak > 0 ? 'text-orange-500' : 'text-slate-300 dark:text-slate-600'
              )}
              fill={streak > 0 ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
            <span
              className={cn(
                'text-sm font-semibold font-mono',
                streak > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'
              )}
            >
              {streak}
            </span>
          </div>

          {/* Task count */}
          <span className="text-sm font-semibold font-mono text-stone-800 dark:text-slate-200">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-amber-100 dark:bg-slate-700 overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            isComplete ? 'momentum-complete' : '',
            progress > 0 ? 'momentum-bar-fill' : ''
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-label={`${completedCount} of ${totalCount} tasks completed`}
        />
      </div>
    </div>
  );
}

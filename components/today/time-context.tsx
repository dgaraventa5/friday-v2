'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TimeContextProps {
  remainingTasks: number;
  remainingMinutes: number;
  className?: string;
}

export function TimeContext({
  remainingTasks,
  remainingMinutes,
  className,
}: TimeContextProps) {
  // Use client-only rendering to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with similar dimensions to prevent layout shift
    return <div className={cn('h-5', className)} />;
  }

  // All tasks complete
  if (remainingTasks === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        <span className="text-green-600 dark:text-green-400 font-medium">
          All done!
        </span>
      </div>
    );
  }

  // Format the remaining time
  const timeText = formatTime(remainingMinutes);

  // Singular/plural for tasks
  const taskText = remainingTasks === 1 ? 'task' : 'tasks';

  return (
    <div className={cn('text-sm text-muted-foreground', className)}>
      <span className="font-medium text-slate-700 dark:text-slate-300">
        {remainingTasks} {taskText}
      </span>
      {remainingMinutes > 0 && (
        <>
          <span className="mx-1.5">·</span>
          <span>{timeText}</span>
        </>
      )}
    </div>
  );
}

function formatTime(minutes: number): string {
  if (minutes <= 0) {
    return '';
  }

  if (minutes < 60) {
    return `~${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  if (remainingMins === 0) {
    return `~${hours}h`;
  }

  // For times close to a whole hour, just show hours
  if (remainingMins <= 10) {
    return `~${hours}h`;
  }

  return `~${hours}h ${remainingMins}m`;
}

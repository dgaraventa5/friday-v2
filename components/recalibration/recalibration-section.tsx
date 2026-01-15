'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Calendar, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecalibrationSectionProps {
  title: string;
  count: number;
  variant: 'warning' | 'default' | 'muted';
  defaultCollapsed?: boolean;
  children: ReactNode;
}

const variantStyles = {
  warning: {
    container: 'border-amber-200 dark:border-amber-800',
    header: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    icon: AlertTriangle,
  },
  default: {
    container: 'border-slate-200 dark:border-slate-700',
    header: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300',
    icon: Calendar,
  },
  muted: {
    container: 'border-slate-200 dark:border-slate-700',
    header: 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400',
    icon: CalendarClock,
  },
};

export function RecalibrationSection({
  title,
  count,
  variant,
  defaultCollapsed = false,
  children,
}: RecalibrationSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div className={cn('rounded-lg border', styles.container)}>
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-t-lg',
          styles.header,
          isCollapsed && 'rounded-b-lg'
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="font-medium text-sm">{title}</span>
          <span className="text-xs opacity-75">({count})</span>
        </div>
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {!isCollapsed && (
        <div className="p-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

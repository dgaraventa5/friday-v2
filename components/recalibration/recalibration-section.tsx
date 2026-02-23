'use client';

import { ReactNode, useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface RecalibrationSectionProps {
  title: string;
  count: number;
  variant: 'warning' | 'default' | 'muted';
  defaultCollapsed?: boolean;
  children: ReactNode;
}

export function RecalibrationSection({
  title,
  count,
  variant,
  defaultCollapsed = false,
  children,
}: RecalibrationSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const titleColor = variant === 'warning'
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-muted-foreground';

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 mb-2 group"
      >
        {defaultCollapsed && (
          isCollapsed
            ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-150" />
            : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-150" />
        )}
        <span className={`text-xs font-semibold uppercase tracking-wider ${titleColor}`}>
          {title}
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums bg-muted/60 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      </button>
      {!isCollapsed && (
        <div className="space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface EisenhowerPickerProps {
  importance: 'important' | 'not-important';
  urgency: 'urgent' | 'not-urgent';
  onChange: (importance: 'important' | 'not-important', urgency: 'urgent' | 'not-urgent') => void;
}

const QUADRANTS = [
  {
    importance: 'important' as const,
    urgency: 'urgent' as const,
    label: 'Critical',
    sublabel: 'Do First',
    selected: 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400',
    unselected: 'bg-red-50/60 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:bg-red-950/20 dark:border-red-800/40 dark:text-red-400/80 dark:hover:border-red-700 dark:hover:bg-red-900/25',
  },
  {
    importance: 'important' as const,
    urgency: 'not-urgent' as const,
    label: 'Plan',
    sublabel: 'Schedule',
    selected: 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400',
    unselected: 'bg-blue-50/60 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 dark:bg-blue-950/20 dark:border-blue-800/40 dark:text-blue-400/80 dark:hover:border-blue-700 dark:hover:bg-blue-900/25',
  },
  {
    importance: 'not-important' as const,
    urgency: 'urgent' as const,
    label: 'Delegate',
    sublabel: 'Quick Wins',
    selected: 'bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400',
    unselected: 'bg-amber-50/60 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-400/80 dark:hover:border-amber-700 dark:hover:bg-amber-900/25',
  },
  {
    importance: 'not-important' as const,
    urgency: 'not-urgent' as const,
    label: 'Backlog',
    sublabel: 'Consider',
    selected: 'bg-slate-100 border-slate-400 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400',
    unselected: 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800/20 dark:border-slate-700/40 dark:text-slate-400/80 dark:hover:border-slate-600 dark:hover:bg-slate-800/30',
  },
] as const;

export function EisenhowerPicker({ importance, urgency, onChange }: EisenhowerPickerProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const len = QUADRANTS.length;
    let next: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (index + 1) % len;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (index - 1 + len) % len;
        break;
      default:
        return;
    }

    e.preventDefault();
    const q = QUADRANTS[next];
    onChange(q.importance, q.urgency);
    buttonRefs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label="Eisenhower Matrix quadrant"
      className="grid grid-cols-2 gap-2"
    >
      {QUADRANTS.map((q, i) => {
        const isSelected = q.importance === importance && q.urgency === urgency;
        return (
          <button
            key={`${q.urgency}-${q.importance}`}
            ref={(el) => { buttonRefs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${q.label}: ${q.sublabel}`}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(q.importance, q.urgency)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 px-3 py-2.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isSelected ? q.selected : q.unselected
            )}
          >
            <span className="text-sm font-semibold leading-tight">{q.label}</span>
            <span className="text-xs opacity-75 leading-tight">{q.sublabel}</span>
          </button>
        );
      })}
    </div>
  );
}

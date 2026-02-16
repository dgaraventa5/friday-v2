'use client';

import { useState } from 'react';
import { Task } from '@/lib/types';
import { getEisenhowerQuadrant, getPriorityReason, getScoreBreakdown } from '@/lib/utils/task-prioritization';
import { formatDateStringForDisplay } from '@/lib/utils/date-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MoreVertical, Clock, Calendar, Repeat, Pencil, Trash2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TaskTileProps {
  task: Task;
  rank: number;
  onComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  style?: React.CSSProperties;
  className?: string;
}

const QUADRANT_BORDER: Record<string, string> = {
  'urgent-important': 'border-l-red-500',
  'not-urgent-important': 'border-l-blue-500',
  'urgent-not-important': 'border-l-amber-500',
  'not-urgent-not-important': 'border-l-slate-400',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  Work: '\u{1F4BC}',
  Home: '\u{1F3E0}',
  Health: '\u{2764}\u{FE0F}',
  Personal: '\u{2B50}',
};

export function TaskTile({ task, rank, onComplete, onEdit, onDelete, style, className }: TaskTileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const quadrant = getEisenhowerQuadrant(task);
  const priorityReason = getPriorityReason(task);
  const borderColor = QUADRANT_BORDER[quadrant];

  return (
    <div
      className={cn(
        'mc-card border-l-4 p-3 sm:p-4',
        borderColor,
        task.completed && 'animate-tile-complete',
        className
      )}
      style={style}
    >
      {/* Main row */}
      <div className="flex items-start gap-3">
        {/* Rank badge */}
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold font-mono',
            task.completed
              ? 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          )}
        >
          {rank}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  'text-sm font-semibold leading-tight text-stone-800 dark:text-slate-100',
                  task.completed && 'line-through text-stone-400 dark:text-slate-500'
                )}
              >
                {task.title}
              </h3>
              {/* Priority reason */}
              <p className={cn(
                'text-xs mt-0.5 text-stone-500 dark:text-slate-400',
                task.completed && 'text-stone-300 dark:text-slate-600'
              )}>
                {priorityReason}
                {task.category && (
                  <span className="ml-2" title={task.category}>
                    {CATEGORY_EMOJIS[task.category]}
                  </span>
                )}
              </p>
            </div>

            {/* Right side: checkbox + menu */}
            <div className="flex items-center gap-1 shrink-0">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onComplete(task.id)}
                className="h-5 w-5"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-slate-700"
                    aria-label="Task options"
                  >
                    <MoreVertical className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Pencil className="h-4 w-4 mr-2" aria-hidden="true" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(task.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Expand toggle */}
      {!task.completed && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
          aria-expanded={isExpanded}
        >
          <ChevronDown className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-180')} />
          <span>{isExpanded ? 'Less' : 'Details'}</span>
        </button>
      )}

      {/* Expanded details */}
      {isExpanded && !task.completed && (
        <ExpandedDetails task={task} />
      )}
    </div>
  );
}

function ExpandedDetails({ task }: { task: Task }) {
  const breakdown = getScoreBreakdown(task);

  // Normalize scores for bar widths (relative to max component)
  const maxComponent = Math.max(breakdown.base, breakdown.deadline, breakdown.duration, breakdown.age, 1);
  const factors = [
    { label: 'Importance', value: breakdown.base, color: 'bg-blue-400' },
    { label: 'Deadline', value: breakdown.deadline, color: 'bg-red-400' },
    { label: 'Time pressure', value: breakdown.duration, color: 'bg-amber-400' },
    { label: 'Age', value: breakdown.age, color: 'bg-slate-400' },
  ].filter(f => f.value > 0);

  return (
    <div className="mt-3 pt-3 border-t border-amber-100 dark:border-slate-700 space-y-3">
      {/* Description */}
      {task.description && (
        <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Score breakdown bars */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">Priority factors</p>
        {factors.map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-[10px] text-stone-500 w-20 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-stone-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full animate-bar-fill', color)}
                style={{ '--bar-width': `${(value / maxComponent) * 100}%` } as React.CSSProperties}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap gap-3 text-xs text-stone-500 dark:text-slate-400">
        {task.due_date && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            <span>Due {formatDateStringForDisplay(task.due_date)}</span>
          </div>
        )}
        {task.estimated_hours > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>{task.estimated_hours}h estimated</span>
          </div>
        )}
        {task.is_recurring && (
          <div className="flex items-center gap-1">
            <Repeat className="h-3 w-3" aria-hidden="true" />
            <span>{task.recurring_interval}</span>
          </div>
        )}
      </div>
    </div>
  );
}

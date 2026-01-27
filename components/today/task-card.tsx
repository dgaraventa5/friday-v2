import { Task } from '@/lib/types';
import { getEisenhowerQuadrant } from '@/lib/utils/task-prioritization';
import { formatDateStringForDisplay } from '@/lib/utils/date-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MoreVertical, Clock, Calendar, Repeat } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  isFirst?: boolean;
  onComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const QUADRANT_STYLES = {
  'urgent-important': {
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    label: 'Critical',
    border: 'border-l-red-500 border-l-4',
  },
  'not-urgent-important': {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    label: 'Plan',
    border: 'border-l-blue-500 border-l-4',
  },
  'urgent-not-important': {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    label: 'Urgent',
    border: 'border-l-amber-500 border-l-4',
  },
  'not-urgent-not-important': {
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
    label: 'Backlog',
    border: 'border-l-slate-400 border-l-4',
  },
};

const CATEGORY_COLORS = {
  Work: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  Home: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  Health: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
  Personal: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
};

const CATEGORY_EMOJIS = {
  Work: '💼',
  Home: '🏠',
  Health: '❤️',
  Personal: '⭐',
};

export function TaskCard({ task, isFirst, onComplete, onEdit, onDelete }: TaskCardProps) {
  const quadrant = getEisenhowerQuadrant(task);
  const styles = QUADRANT_STYLES[quadrant];

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-2.5 md:p-3 lg:p-3 shadow-sm transition-[box-shadow,transform] duration-[250ms] ease-out hover:shadow-md hover:-translate-y-0.5',
        styles.border,
        task.completed && 'opacity-50',
        isFirst && !task.completed && 'task-highlight'
      )}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onComplete(task.id)}
          className="h-4 w-4 shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 md:gap-3">
            <h3
              className={cn(
                'text-sm font-semibold leading-tight text-slate-800 dark:text-slate-100',
                task.completed && 'line-through text-slate-500'
              )}
            >
              {task.title}
            </h3>

            {/* Only recurring indicator stays on left side */}
            {task.is_recurring && (
              <div className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
                <Repeat className="h-3 w-3" aria-hidden="true" />
                <span>{task.recurring_interval}</span>
              </div>
            )}
          </div>

          {/* Mobile metadata - shown only on mobile */}
          <div className="flex md:hidden items-center flex-wrap gap-2 mt-1.5 text-xs text-slate-500">
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', styles.badge)}>
              {styles.label}
            </span>
            <span className="text-base" title={task.category}>
              {CATEGORY_EMOJIS[task.category]}
            </span>
            {task.estimated_hours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span>{task.estimated_hours}h</span>
              </div>
            )}
            {task.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span>{formatDateStringForDisplay(task.due_date)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop metadata - shown only on tablet/desktop, right side */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 shrink-0">
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', styles.badge)}>
            {styles.label}
          </span>
          <span className="text-sm" title={task.category}>
            {CATEGORY_EMOJIS[task.category]}
          </span>
          {task.estimated_hours && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-500" aria-hidden="true" />
              <span>{task.estimated_hours}h</span>
            </div>
          )}
          {task.due_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-500" aria-hidden="true" />
              <span>{formatDateStringForDisplay(task.due_date)}</span>
            </div>
          )}
        </div>

        {/* Menu - now outside of the flex-1 container */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0" aria-label="Task options">
              <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

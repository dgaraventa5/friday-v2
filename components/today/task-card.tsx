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
  onComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const QUADRANT_STYLES = {
  'urgent-important': {
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    label: 'Critical',
    border: 'border-l-red-500',
  },
  'not-urgent-important': {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    label: 'Plan',
    border: 'border-l-blue-500',
  },
  'urgent-not-important': {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    label: 'Urgent',
    border: 'border-l-amber-500',
  },
  'not-urgent-not-important': {
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
    label: 'Backlog',
    border: 'border-l-slate-500',
  },
};

const CATEGORY_COLORS = {
  Work: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Home: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Health: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  Personal: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

export function TaskCard({ task, onComplete, onEdit, onDelete }: TaskCardProps) {
  const quadrant = getEisenhowerQuadrant(task);
  const styles = QUADRANT_STYLES[quadrant];

  return (
    <div
      className={cn(
        'bg-background border rounded-lg p-4 border-l-4 transition-all',
        styles.border,
        task.completed && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onComplete(task.id)}
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className={cn(
                'font-medium leading-snug text-balance',
                task.completed && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
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

          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('text-xs px-2 py-1 rounded-full font-medium', styles.badge)}>
              {styles.label}
            </span>
            <span className={cn('text-xs px-2 py-1 rounded-full font-medium', CATEGORY_COLORS[task.category])}>
              {task.category}
            </span>
            {task.is_recurring && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Repeat className="h-3 w-3" />
                <span>{task.recurring_interval}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            {task.estimated_hours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{task.estimated_hours}h</span>
              </div>
            )}
            {task.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDateStringForDisplay(task.due_date)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

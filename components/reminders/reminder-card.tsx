'use client';

import { ReminderWithStatus } from '@/lib/types';
import { formatTimeLabel, getRecurrenceLabel } from '@/lib/utils/reminder-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MoreVertical, Repeat, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ReminderCardProps {
  reminder: ReminderWithStatus;
  onComplete: (reminderId: string) => void;
  onSkip: (reminderId: string) => void;
  onUndoSkip: (reminderId: string) => void;
  onEdit: (reminder: ReminderWithStatus) => void;
  onDelete: (reminderId: string) => void;
}

export function ReminderCard({
  reminder,
  onComplete,
  onSkip,
  onUndoSkip,
  onEdit,
  onDelete,
}: ReminderCardProps) {
  const isCompleted = reminder.todayStatus === 'completed';
  const isSkipped = reminder.todayStatus === 'skipped';
  const timeDisplay = formatTimeLabel(reminder.time_label);

  const handleCheckboxChange = () => {
    if (isCompleted) {
      // Undo completion - this will delete the completion record
      onComplete(reminder.id);
    } else if (!isSkipped) {
      // Complete the reminder
      onComplete(reminder.id);
    }
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-3 shadow-sm transition-all duration-[250ms] ease-out',
        isCompleted && 'opacity-50',
        isSkipped && 'opacity-40 bg-slate-50 dark:bg-slate-800/50'
      )}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          checked={isCompleted}
          disabled={isSkipped}
          onCheckedChange={handleCheckboxChange}
          className="h-5 w-5 shrink-0 rounded-full"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                'text-sm font-medium leading-tight text-slate-800 dark:text-slate-100 truncate',
                isCompleted && 'line-through text-slate-500',
                isSkipped && 'text-slate-400 dark:text-slate-500'
              )}
            >
              {reminder.title}
            </h3>
          </div>

          <div className="flex items-center flex-wrap gap-2 mt-1 text-xs text-slate-500">
            {isSkipped && (
              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium">
                Skipped
              </span>
            )}
            {timeDisplay && !isSkipped && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{timeDisplay}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-slate-400">
              <Repeat className="h-3 w-3" />
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0"
            >
              <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(reminder)}>
              Edit
            </DropdownMenuItem>
            {isSkipped ? (
              <DropdownMenuItem onClick={() => onUndoSkip(reminder.id)}>
                Undo Skip
              </DropdownMenuItem>
            ) : !isCompleted ? (
              <DropdownMenuItem onClick={() => onSkip(reminder.id)}>
                Skip Today
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onClick={() => onDelete(reminder.id)}
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

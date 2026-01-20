'use client';

import { ReminderWithStatus } from '@/lib/types';
import { formatTimeLabel, getRecurrenceLabel } from '@/lib/utils/reminder-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MoreVertical, Repeat, Clock, Calendar } from 'lucide-react';
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
  const isCalendarSourced = reminder.source === 'calendar';

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
        'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-2.5 shadow-sm transition-opacity duration-[250ms] ease-out',
        isCompleted && 'opacity-50',
        isSkipped && 'opacity-40 bg-slate-50 dark:bg-slate-800/50'
      )}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          checked={isCompleted}
          disabled={isSkipped}
          onCheckedChange={handleCheckboxChange}
          className="h-4 w-4 shrink-0 rounded-full"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                'text-xs font-medium leading-tight text-slate-800 dark:text-slate-100 truncate',
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
            {isCalendarSourced && !isSkipped && (
              <div className="flex items-center gap-1 text-blue-500">
                <Calendar className="h-3 w-3" aria-hidden="true" />
              </div>
            )}
            {timeDisplay && !isSkipped && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                <span>{timeDisplay}</span>
              </div>
            )}
            {!isCalendarSourced && (
              <div className="flex items-center gap-1 text-slate-400">
                <Repeat className="h-3 w-3" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0"
              aria-label="Reminder options"
            >
              <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isCalendarSourced && (
              <DropdownMenuItem onClick={() => onEdit(reminder)}>
                Edit
              </DropdownMenuItem>
            )}
            {isSkipped ? (
              <DropdownMenuItem onClick={() => onUndoSkip(reminder.id)}>
                Undo Skip
              </DropdownMenuItem>
            ) : !isCompleted ? (
              <DropdownMenuItem onClick={() => onSkip(reminder.id)}>
                Skip Today
              </DropdownMenuItem>
            ) : null}
            {!isCalendarSourced && (
              <DropdownMenuItem
                onClick={() => onDelete(reminder.id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            )}
            {isCalendarSourced && (
              <DropdownMenuItem disabled className="text-xs text-slate-400">
                Synced from calendar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

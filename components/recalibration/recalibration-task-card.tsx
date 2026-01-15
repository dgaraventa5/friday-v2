'use client';

import { useState } from 'react';
import { RecalibrationTask, PendingTaskChanges } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MoreVertical, Calendar, Clock, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { DatePresetButtons } from './date-preset-buttons';
import { ImportanceUrgencyToggles } from './importance-urgency-toggles';
import {
  getRelativeDateString,
  formatDueDateForDisplay,
} from '@/lib/utils/recalibration-utils';

interface RecalibrationTaskCardProps {
  task: RecalibrationTask;
  pendingChanges: PendingTaskChanges | undefined;
  isReviewed: boolean;
  onUpdateChanges: (changes: Partial<PendingTaskChanges>) => void;
  onComplete: () => void;
  onHide: () => void;
  onMarkReviewed: () => void;
}

const CATEGORY_COLORS = {
  Work: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  Home: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  Health: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
  Personal: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
};

export function RecalibrationTaskCard({
  task,
  pendingChanges,
  isReviewed,
  onUpdateChanges,
  onComplete,
  onHide,
  onMarkReviewed,
}: RecalibrationTaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  // Get current values (pending changes take precedence)
  const currentImportance = pendingChanges?.importance ?? task.importance;
  const currentUrgency = pendingChanges?.urgency ?? task.urgency;
  const currentDueDate = pendingChanges?.due_date ?? task.due_date;

  const hasChanges = pendingChanges && Object.keys(pendingChanges).length > 0;
  const isTaskReviewed = isReviewed || hasChanges;

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete();
    } finally {
      setIsCompleting(false);
    }
  };

  const handleImportanceChange = (value: 'important' | 'not-important') => {
    onUpdateChanges({ importance: value });
  };

  const handleUrgencyChange = (value: 'urgent' | 'not-urgent') => {
    onUpdateChanges({ urgency: value });
  };

  const handleDateChange = (date: string) => {
    onUpdateChanges({ due_date: date });
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 border rounded-lg p-3 transition-all',
        hasChanges
          ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800'
          : 'border-slate-200 dark:border-slate-700',
        isCompleting && 'opacity-50'
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <Checkbox
          checked={false}
          onCheckedChange={handleComplete}
          disabled={isCompleting}
          className="h-5 w-5 shrink-0 mt-0.5"
        />

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
            {task.title}
          </h3>

          {/* Due date context */}
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <Calendar className="h-3 w-3" />
            <span>
              Was due: {formatDueDateForDisplay(task.originalDueDate)}{' '}
              <span className="text-slate-400">
                ({getRelativeDateString(task.originalDueDate)})
              </span>
            </span>
          </div>

          {/* Category and estimate */}
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                CATEGORY_COLORS[task.category]
              )}
            >
              {task.category}
            </span>
            {task.estimated_hours > 0 && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                <span>{task.estimated_hours}h</span>
              </div>
            )}
          </div>
        </div>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0"
            >
              <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onHide}>
              Remove from review
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* New due date selection */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="text-xs text-slate-500 mb-2">New due date:</div>
        <DatePresetButtons
          currentDueDate={task.due_date || task.originalDueDate}
          selectedDate={pendingChanges?.due_date}
          onDateChange={handleDateChange}
        />
      </div>

      {/* Importance/Urgency toggles */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <ImportanceUrgencyToggles
          importance={currentImportance}
          urgency={currentUrgency}
          onImportanceChange={handleImportanceChange}
          onUrgencyChange={handleUrgencyChange}
          compact
        />
      </div>

      {/* Keep as-is button (only shows if not already reviewed) */}
      {!isTaskReviewed && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-slate-500 hover:text-slate-700"
            onClick={onMarkReviewed}
          >
            <Check className="h-3 w-3 mr-1" />
            Keep as-is
          </Button>
        </div>
      )}

      {/* Modified indicator */}
      {hasChanges && (
        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>Modified</span>
        </div>
      )}
    </div>
  );
}

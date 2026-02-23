'use client';

import { useState } from 'react';
import { RecalibrationTask, PendingTaskChanges } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { MoreVertical, Clock, Check } from 'lucide-react';
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
  calculatePresetDate,
} from '@/lib/utils/recalibration-utils';

interface RecalibrationTaskCardProps {
  task: RecalibrationTask;
  pendingChanges: PendingTaskChanges | undefined;
  isReviewed: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateChanges: (changes: Partial<PendingTaskChanges>) => void;
  onComplete: () => void;
  onHide: () => void;
  onMarkReviewed: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Work: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  Home: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  Health: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
  Personal: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
};

export function RecalibrationTaskCard({
  task,
  pendingChanges,
  isReviewed,
  isExpanded,
  onToggleExpand,
  onUpdateChanges,
  onComplete,
  onHide,
  onMarkReviewed,
}: RecalibrationTaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const currentImportance = pendingChanges?.importance ?? task.importance;
  const currentUrgency = pendingChanges?.urgency ?? task.urgency;

  const hasChanges = pendingChanges && Object.keys(pendingChanges).length > 0;
  const isTaskReviewed = isReviewed || !!hasChanges;

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

  // Determine the date badge text
  const getDateBadge = () => {
    if (pendingChanges?.due_date) {
      const preset = (['tomorrow', 'plus3', 'plus7'] as const).find(
        p => calculatePresetDate(p) === pendingChanges.due_date
      );
      if (preset === 'tomorrow') return '→ Tomorrow';
      if (preset === 'plus3') return '→ +3 Days';
      if (preset === 'plus7') return '→ +1 Week';
      return '→ Rescheduled';
    }
    return getRelativeDateString(task.originalDueDate);
  };

  return (
    <div
      className={cn(
        'bg-card border rounded-lg transition-all',
        hasChanges
          ? 'border-blue-300 dark:border-blue-700'
          : 'border-border',
        isCompleting && 'opacity-50'
      )}
    >
      {/* Collapsed row - always visible, tappable to expand */}
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2.5',
          !isExpanded && 'cursor-pointer'
        )}
        onClick={isExpanded ? undefined : onToggleExpand}
        role={isExpanded ? undefined : 'button'}
        tabIndex={isExpanded ? undefined : 0}
        onKeyDown={isExpanded ? undefined : (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        }}
      >
        <Checkbox
          checked={false}
          onCheckedChange={handleComplete}
          disabled={isCompleting}
          className="h-5 w-5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-foreground truncate">
              {task.title}
            </h3>
            <span className={cn(
              'text-xs shrink-0',
              pendingChanges?.due_date
                ? 'text-blue-600 dark:text-blue-400 font-medium'
                : 'text-muted-foreground'
            )}>
              {getDateBadge()}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                CATEGORY_COLORS[task.category] || 'bg-muted text-muted-foreground'
              )}
            >
              {task.category}
            </span>
            {task.estimated_hours > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {task.estimated_hours}h
              </span>
            )}
            {hasChanges && !isExpanded && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-auto shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded controls */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Overflow menu */}
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onHide}>
                  Remove from review
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Date presets */}
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Reschedule:</div>
            <DatePresetButtons
              currentDueDate={task.due_date || task.originalDueDate}
              selectedDate={pendingChanges?.due_date}
              onDateChange={handleDateChange}
            />
          </div>

          {/* Importance/Urgency */}
          <ImportanceUrgencyToggles
            importance={currentImportance}
            urgency={currentUrgency}
            onImportanceChange={handleImportanceChange}
            onUrgencyChange={handleUrgencyChange}
            compact
          />

          {/* Keep as-is */}
          {!isTaskReviewed && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={onMarkReviewed}
            >
              <Check className="h-3 w-3 mr-1" />
              Keep as-is
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

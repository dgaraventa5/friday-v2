'use client';

import { useState, useMemo } from 'react';
import { Task, EisenhowerQuadrant } from '@/lib/types';
import { addPriorityScores, getTodaysFocusTasks, getEisenhowerQuadrant } from '@/lib/utils/task-prioritization';
import { getTodayLocal, parseDateLocal, addDaysToDateString } from '@/lib/utils/date-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScheduleViewProps {
  tasks: Task[];
  onTaskComplete: (taskId: string, skipAutoSchedule?: boolean) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

interface DateSection {
  dateStr: string;
  label: string;
  isToday: boolean;
  isTomorrow: boolean;
  isPast: boolean;
  incompleteTasks: Task[];
  completedTasks: Task[];
  totalHours: number;
}

// ---------------------------------------------------------------------------
// Quadrant styling helpers
// ---------------------------------------------------------------------------

const QUADRANT_DOT_COLOR: Record<EisenhowerQuadrant, string> = {
  'urgent-important': 'bg-red-500',
  'not-urgent-important': 'bg-blue-500',
  'urgent-not-important': 'bg-amber-500',
  'not-urgent-not-important': 'bg-slate-400',
};

const QUADRANT_LABEL: Record<EisenhowerQuadrant, string> = {
  'urgent-important': 'Q1',
  'not-urgent-important': 'Q2',
  'urgent-not-important': 'Q3',
  'not-urgent-not-important': 'Q4',
};

// ---------------------------------------------------------------------------
// ScheduleTaskRow — compact row for a single task
// ---------------------------------------------------------------------------

interface ScheduleTaskRowProps {
  task: Task;
  onComplete: (taskId: string, skipAutoSchedule?: boolean) => void;
  onEdit: (task: Task) => void;
}

function ScheduleTaskRow({ task, onComplete, onEdit }: ScheduleTaskRowProps) {
  const quadrant = getEisenhowerQuadrant(task);
  const dotColor = QUADRANT_DOT_COLOR[quadrant];

  return (
    <div
      className={cn(
        'group flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-lg',
        'hover:bg-amber-50/60 dark:hover:bg-slate-800/60 transition-colors',
        task.completed && 'opacity-50'
      )}
    >
      {/* Checkbox */}
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onComplete(task.id)}
        className="h-4 w-4 shrink-0"
      />

      {/* Title — clickable to edit */}
      <button
        onClick={() => onEdit(task)}
        className={cn(
          'flex-1 min-w-0 text-left text-sm text-stone-700 dark:text-slate-200 truncate',
          'hover:text-stone-900 dark:hover:text-white transition-colors',
          task.completed && 'line-through text-stone-400 dark:text-slate-500'
        )}
      >
        {task.title}
      </button>

      {/* Quadrant badge */}
      <span
        className={cn(
          'inline-flex items-center gap-1 shrink-0 text-[10px] font-medium text-stone-500 dark:text-slate-400'
        )}
        title={quadrant}
      >
        <span className={cn('h-2 w-2 rounded-full', dotColor)} aria-hidden="true" />
        <span className="hidden sm:inline">{QUADRANT_LABEL[quadrant]}</span>
      </span>

      {/* Due date (if present and not same as start_date) */}
      {task.due_date && (
        <span className="shrink-0 text-[11px] text-stone-400 dark:text-slate-500 tabular-nums">
          {formatDueDate(task.due_date)}
        </span>
      )}
    </div>
  );
}

function formatDueDate(dueDateStr: string): string {
  const todayStr = getTodayLocal();
  if (dueDateStr === todayStr) return 'today';

  const tomorrowStr = addDaysToDateString(todayStr, 1);
  if (dueDateStr === tomorrowStr) return 'tmrw';

  const dueDate = parseDateLocal(dueDateStr);
  const today = parseDateLocal(todayStr);
  const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;
  if (diffDays <= 7) return `${diffDays}d`;

  return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// CollapsibleDateSection
// ---------------------------------------------------------------------------

interface CollapsibleDateSectionProps {
  section: DateSection;
  defaultOpen: boolean;
  onTaskComplete: (taskId: string, skipAutoSchedule?: boolean) => void;
  onTaskEdit: (task: Task) => void;
}

function CollapsibleDateSection({ section, defaultOpen, onTaskComplete, onTaskEdit }: CollapsibleDateSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const totalTasks = section.incompleteTasks.length + section.completedTasks.length;

  return (
    <div className="relative mb-6">
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute -left-[25px] top-[5px] h-3 w-3 rounded-full border-2',
          section.isPast
            ? 'border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-900/40'
            : section.isToday
              ? 'border-amber-500 bg-amber-100 dark:border-amber-400 dark:bg-amber-900/40'
              : 'border-amber-300 bg-white dark:border-slate-600 dark:bg-slate-800'
        )}
        aria-hidden="true"
      />

      {/* Date header — always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 w-full text-left group/header',
          section.isPast && 'mb-2',
          !section.isPast && 'mb-2'
        )}
        aria-expanded={isOpen}
      >
        {/* Chevron for collapsible sections */}
        <span className="text-stone-400 dark:text-slate-500">
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </span>

        <h3
          className={cn(
            'text-sm font-semibold',
            section.isPast
              ? 'text-red-600 dark:text-red-400'
              : section.isToday
                ? 'text-stone-900 dark:text-slate-50'
                : 'text-stone-700 dark:text-slate-300'
          )}
        >
          {section.label}
        </h3>

        <span className="text-xs text-stone-400 dark:text-slate-500 tabular-nums">
          {totalTasks} task{totalTasks !== 1 ? 's' : ''}
        </span>

        {section.totalHours > 0 && (
          <span className="text-xs text-stone-400 dark:text-slate-500 tabular-nums">
            {section.totalHours}h
          </span>
        )}

        {section.isPast && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-medium">
            Overdue
          </span>
        )}
      </button>

      {/* Task rows */}
      {isOpen && (
        <div
          className={cn(
            'ml-6 rounded-lg',
            section.isPast && 'bg-red-50/50 dark:bg-red-950/20 px-2 py-1 -mx-2',
            section.isToday && 'bg-amber-50/40 dark:bg-amber-950/10 px-2 py-1 -mx-2'
          )}
        >
          {section.incompleteTasks.map((task) => (
            <ScheduleTaskRow
              key={task.id}
              task={task}
              onComplete={onTaskComplete}
              onEdit={onTaskEdit}
            />
          ))}
          {section.completedTasks.map((task) => (
            <ScheduleTaskRow
              key={task.id}
              task={task}
              onComplete={onTaskComplete}
              onEdit={onTaskEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScheduleView (main export)
// ---------------------------------------------------------------------------

export function ScheduleView({
  tasks,
  onTaskComplete,
  onTaskEdit,
  onTaskDelete,
}: ScheduleViewProps) {
  const todayStr = getTodayLocal();
  const tomorrowStr = addDaysToDateString(todayStr, 1);
  // Dates 3+ days from now default to collapsed
  const collapseThreshold = addDaysToDateString(todayStr, 3);

  const sections = useMemo(() => {
    // Build grouped tasks map (same logic as before)
    const groupedTasks = new Map<string, { incomplete: Task[]; completed: Task[] }>();

    // For today, use getTodaysFocusTasks which enforces the 4-task cap
    const todaysTasks = getTodaysFocusTasks(tasks);
    const todaysTaskIds = new Set(todaysTasks.map((t) => t.id));

    for (const task of tasks) {
      if (!task.start_date) continue;

      // Skip past incomplete recurring tasks
      if (task.is_recurring && !task.completed && task.start_date < todayStr) {
        continue;
      }

      const date = task.start_date;
      const isToday = date === todayStr;

      // For today, only include tasks that passed the 4-task cap filter
      if (isToday && !todaysTaskIds.has(task.id)) {
        continue;
      }

      if (!groupedTasks.has(date)) {
        groupedTasks.set(date, { incomplete: [], completed: [] });
      }
      const bucket = groupedTasks.get(date)!;

      if (task.completed && isToday) {
        bucket.completed.push(task);
      } else if (!task.completed) {
        bucket.incomplete.push(task);
      }
    }

    // Sort dates and build sections
    const sortedDates = Array.from(groupedTasks.entries())
      .filter(
        ([, tasksForDate]) =>
          tasksForDate.incomplete.length > 0 || tasksForDate.completed.length > 0
      )
      .map(([date]) => date)
      .sort();

    return sortedDates.map((dateStr): DateSection => {
      const dateTasks = groupedTasks.get(dateStr)!;

      const incompleteTasks = addPriorityScores(dateTasks.incomplete).sort(
        (a, b) => b.priorityScore - a.priorityScore
      );

      const completedTasks = [...dateTasks.completed].sort((a, b) => {
        if (a.completed_at && b.completed_at) {
          return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
        }
        if (a.completed_at) return -1;
        if (b.completed_at) return 1;
        return a.title.localeCompare(b.title);
      });

      const isToday = dateStr === todayStr;
      const isTomorrow = dateStr === tomorrowStr;

      const taskDate = parseDateLocal(dateStr);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const isPast = taskDate < todayDate && !isToday;

      // Build human-readable label
      let label = taskDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      if (isToday) label = `Today, ${label}`;
      else if (isTomorrow) label = `Tomorrow, ${label}`;

      // Sum estimated hours
      const totalHours = [...incompleteTasks, ...completedTasks].reduce(
        (sum, t) => sum + (t.estimated_hours || 0),
        0
      );

      return {
        dateStr,
        label,
        isToday,
        isTomorrow,
        isPast,
        incompleteTasks,
        completedTasks,
        totalHours: Math.round(totalHours * 10) / 10,
      };
    });
  }, [tasks, todayStr, tomorrowStr]);

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (sections.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 py-12 md:py-20 text-center">
        <Calendar
          className="h-12 w-12 md:h-16 md:w-16 text-amber-300 dark:text-slate-600 mb-4"
          aria-hidden="true"
        />
        <h3 className="text-base md:text-lg font-semibold text-stone-700 dark:text-slate-200 mb-2">
          No Scheduled Tasks
        </h3>
        <p className="text-sm md:text-base text-stone-500 dark:text-slate-400 max-w-sm text-pretty">
          Add tasks and they will be automatically scheduled based on priority and capacity.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Timeline
  // ---------------------------------------------------------------------------

  return (
    <div className="h-full overflow-y-auto">
      <div className="pb-24 lg:pb-32 px-1 md:px-2">
        {/* Timeline wrapper */}
        <div className="relative pl-7">
          {/* Vertical timeline line */}
          <div
            className="absolute left-[9px] top-2 bottom-6 w-px bg-amber-200 dark:bg-slate-700"
            aria-hidden="true"
          />

          {sections.map((section) => {
            // Determine default open state:
            // - overdue & today & tomorrow are always open
            // - up to 3 days out: open
            // - beyond 3 days: collapsed
            const defaultOpen =
              section.isPast ||
              section.isToday ||
              section.isTomorrow ||
              section.dateStr < collapseThreshold;

            return (
              <CollapsibleDateSection
                key={section.dateStr}
                section={section}
                defaultOpen={defaultOpen}
                onTaskComplete={onTaskComplete}
                onTaskEdit={onTaskEdit}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

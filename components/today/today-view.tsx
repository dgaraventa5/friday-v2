'use client';

import { useState } from 'react';
import { Task, Profile, ReminderWithStatus, CalendarEventWithCalendar, ConnectedCalendar } from '@/lib/types';
import { getTodaysFocusTasks } from '@/lib/utils/task-prioritization';
import { MomentumBar } from './momentum-bar';
import { TaskTile } from './task-tile';
import { InlineQuickAdd } from './inline-quick-add';
import { CelebrationState } from './celebration-state';
import { WelcomeMessage } from './welcome-message';
import { RemindersSection } from '@/components/reminders/reminders-section';
import { CalendarSection } from '@/components/calendar/calendar-section';
import { Button } from '@/components/ui/button';
import { ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodayViewProps {
  tasks: Task[];
  profile: Profile;
  reminders: ReminderWithStatus[];
  calendarEvents?: CalendarEventWithCalendar[];
  calendarConnections?: ConnectedCalendar[];
  calendarLastSyncedAt?: string | null;
  calendarIsLoading?: boolean;
  onCalendarRefresh?: () => void;
  onTaskComplete: (taskId: string, skipAutoSchedule?: boolean) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onPullTaskToToday?: (taskId: string) => void;
  onOpenAddDialog?: () => void;
  onQuickAdd?: (title: string) => void;
  onReminderComplete: (reminderId: string) => void;
  onReminderSkip: (reminderId: string) => void;
  onReminderUndoSkip: (reminderId: string) => void;
  onReminderEdit: (reminder: ReminderWithStatus) => void;
  onReminderDelete: (reminderId: string) => void;
  onOpenAddReminderDialog: () => void;
}

const BASELINE_TASKS = 4;

export function TodayView({
  tasks,
  profile,
  reminders,
  calendarEvents = [],
  calendarConnections = [],
  calendarLastSyncedAt,
  calendarIsLoading = false,
  onCalendarRefresh,
  onTaskComplete,
  onTaskEdit,
  onTaskDelete,
  onPullTaskToToday,
  onOpenAddDialog,
  onQuickAdd,
  onReminderComplete,
  onReminderSkip,
  onReminderUndoSkip,
  onReminderEdit,
  onReminderDelete,
  onOpenAddReminderDialog,
}: TodayViewProps) {
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const focusTasks = getTodaysFocusTasks(tasks);
  const incompleteTasks = focusTasks.filter(t => !t.completed);
  const completedTasks = focusTasks.filter(t => t.completed);

  const completedCount = completedTasks.length;
  const totalCount = focusTasks.length;
  const allComplete = incompleteTasks.length === 0 && completedTasks.length > 0;

  const handleTaskComplete = (taskId: string) => {
    // Always skip auto-schedule to prevent immediate backfill,
    // allowing the user to decide when to pull the next task
    onTaskComplete(taskId, true);
  };

  const handleQuickAdd = (title: string) => {
    if (onQuickAdd) {
      onQuickAdd(title);
    }
  };

  const handleOpenFullForm = () => {
    if (onOpenAddDialog) {
      onOpenAddDialog();
    }
  };

  // Show welcome message if no tasks and onboarding not complete
  if (tasks.length === 0 && !profile.onboarding_completed) {
    return <WelcomeMessage />;
  }

  return (
    <div>
      {/* Two-column responsive layout: single column on mobile, 60/40 on desktop */}
      <div className="flex flex-col lg:flex-row lg:gap-6">

        {/* Left column: MomentumBar + Tasks + QuickAdd + Completed */}
        <div className="w-full lg:w-[60%] space-y-4">

          {/* Momentum Bar */}
          <MomentumBar
            completedCount={completedCount}
            totalCount={totalCount}
            streak={profile.current_streak}
            className="rounded-xl border border-amber-100 bg-white dark:bg-slate-900 dark:border-slate-700"
          />

          {/* Task Tiles */}
          {allComplete ? (
            <CelebrationState
              completedCount={completedCount}
              baselineCount={BASELINE_TASKS}
            />
          ) : (
            <div className="space-y-3">
              {incompleteTasks.length === 0 && completedTasks.length === 0 && (
                <div className="text-center py-12 text-stone-400 dark:text-slate-500">
                  <p className="text-base">No tasks scheduled for today</p>
                  <p className="text-sm mt-2">Add a task to get started</p>
                </div>
              )}

              {incompleteTasks.map((task, index) => (
                <TaskTile
                  key={task.id}
                  task={task}
                  rank={index + 1}
                  onComplete={handleTaskComplete}
                  onEdit={onTaskEdit}
                  onDelete={onTaskDelete}
                />
              ))}
            </div>
          )}

          {/* Inline Quick Add */}
          <InlineQuickAdd
            onQuickAdd={handleQuickAdd}
            onOpenFullForm={handleOpenFullForm}
          />

          {/* Collapsible Completed Section */}
          {completedTasks.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setCompletedExpanded(!completedExpanded)}
                className="flex items-center gap-2 w-full text-left px-1 py-2 group"
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-stone-400 dark:text-slate-500 transition-transform',
                    completedExpanded && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium text-stone-500 dark:text-slate-400 group-hover:text-stone-700 dark:group-hover:text-slate-300 transition-colors">
                  Completed today ({completedTasks.length})
                </span>
              </button>

              {completedExpanded && (
                <div className="space-y-3 mt-2">
                  {completedTasks.map((task, index) => (
                    <TaskTile
                      key={task.id}
                      task={task}
                      rank={incompleteTasks.length + index + 1}
                      onComplete={handleTaskComplete}
                      onEdit={onTaskEdit}
                      onDelete={onTaskDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Calendar + Reminders */}
        <div className="w-full lg:w-[40%] mt-6 lg:mt-0 space-y-4">

          {/* Calendar Section */}
          <div className="mc-card p-4">
            <CalendarSection
              events={calendarEvents}
              connections={calendarConnections}
              lastSyncedAt={calendarLastSyncedAt ?? null}
              isLoading={calendarIsLoading}
              onRefresh={onCalendarRefresh}
            />
          </div>

          {/* Reminders Section */}
          <div className="mc-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-stone-800 dark:text-slate-100">
                Daily Reminders
              </h2>
              {onOpenAddReminderDialog && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenAddReminderDialog}
                  className="h-8 w-8 p-0 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-slate-700"
                  aria-label="Add reminder"
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </Button>
              )}
            </div>
            {reminders.length === 0 ? (
              <div className="text-center py-6 text-stone-400 dark:text-slate-500">
                <p className="text-sm">No reminders for today</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={onOpenAddReminderDialog}
                  className="mt-1 text-xs"
                >
                  Add a reminder
                </Button>
              </div>
            ) : (
              <RemindersSection
                reminders={reminders}
                onComplete={onReminderComplete}
                onSkip={onReminderSkip}
                onUndoSkip={onReminderUndoSkip}
                onEdit={onReminderEdit}
                onDelete={onReminderDelete}
                onAddNew={onOpenAddReminderDialog}
                hideHeader={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

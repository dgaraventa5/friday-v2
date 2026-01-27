'use client';

import { useMemo } from 'react';
import { Task, Profile, ReminderWithStatus, CalendarEventWithCalendar, ConnectedCalendar } from '@/lib/types';
import { getTodaysFocusTasks, addPriorityScores } from '@/lib/utils/task-prioritization';
import { getWeeklyCompletionTrend, calculateRemainingMinutes } from '@/lib/utils/stats-utils';
import { TaskCard } from './task-card';
import { CelebrationState } from './celebration-state';
import { WelcomeMessage } from './welcome-message';
import { AddTaskGhost } from './add-task-ghost';
import { ProgressHero } from './progress-hero';
import { ProgressDock } from './progress-dock';
import { RemindersSection } from '@/components/reminders/reminders-section';
import { CalendarSection } from '@/components/calendar/calendar-section';
import { getTodayLocal } from '@/lib/utils/date-utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

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
  onReminderComplete,
  onReminderSkip,
  onReminderUndoSkip,
  onReminderEdit,
  onReminderDelete,
  onOpenAddReminderDialog,
}: TodayViewProps) {
  const { toast } = useToast();

  const focusTasks = getTodaysFocusTasks(tasks);
  const incompleteTasks = focusTasks.filter(t => !t.completed);
  const completedTasks = focusTasks.filter(t => t.completed);

  const completedCount = completedTasks.length;
  const totalCount = focusTasks.length;
  const allComplete = incompleteTasks.length === 0 && completedTasks.length > 0;

  // Calculate stats for progress components
  const weeklyTrend = useMemo(() => getWeeklyCompletionTrend(tasks), [tasks]);
  const remainingMinutes = useMemo(() => calculateRemainingMinutes(tasks), [tasks]);

  const handleTaskComplete = (taskId: string) => {
    // Always skip auto-schedule to prevent immediate backfill,
    // allowing the user to decide when to pull the next task
    onTaskComplete(taskId, true);
  };

  const handleAutoPullTask = async () => {
    // Auto-pull the next highest priority task from backlog
    const todayStr = getTodayLocal();
    const availableTasks = tasks.filter(
      t => !t.completed &&
           !t.is_recurring &&
           t.start_date &&
           t.start_date > todayStr
    );

    if (availableTasks.length === 0) {
      toast({
        title: 'No Tasks Available',
        description: 'There are no upcoming tasks to add to today.',
      });
      return;
    }

    // Score and sort by priority
    const scoredTasks = addPriorityScores(availableTasks);
    scoredTasks.sort((a, b) => b.priorityScore - a.priorityScore);

    // Pull the highest priority task
    const nextTask = scoredTasks[0];
    if (onPullTaskToToday) {
      await onPullTaskToToday(nextTask.id);
      // Toast notification is already handled in handlePullTaskToToday
    }
  };

  // Show welcome message if no tasks and onboarding not complete
  if (tasks.length === 0 && !profile.onboarding_completed) {
    return <WelcomeMessage />;
  }

  // Tasks section content
  const TasksContent = (
    <div className="space-y-2">
      {allComplete ? (
        <CelebrationState
          completedCount={completedCount}
          baselineCount={BASELINE_TASKS}
        />
      ) : (
        <>
          {incompleteTasks.length === 0 && completedTasks.length === 0 && (
            <div className="text-center py-12 md:py-16 text-muted-foreground">
              <p className="text-base md:text-lg">No tasks scheduled for today</p>
              <p className="text-sm md:text-base mt-2">Add a task to get started</p>
            </div>
          )}

          {incompleteTasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              isFirst={index === 0}
              onComplete={handleTaskComplete}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
            />
          ))}
        </>
      )}

      {/* Only show ghost button after 2 tasks completed to reduce anxiety */}
      {completedCount >= 2 && (
        <AddTaskGhost onClick={handleAutoPullTask} />
      )}

      {completedTasks.length > 0 && (
        <div className="pt-3 space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground px-1">
            Completed Today
          </h3>
          {completedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={handleTaskComplete}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Calendar section content
  const CalendarContent = (
    <CalendarSection
      events={calendarEvents}
      connections={calendarConnections}
      lastSyncedAt={calendarLastSyncedAt ?? null}
      isLoading={calendarIsLoading}
      onRefresh={onCalendarRefresh}
    />
  );

  // Reminders section content for desktop
  const RemindersContent = (
    <div className="space-y-2">
      {reminders.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
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
  );

  return (
    <>
      {/* Mobile/Tablet layout (< 1024px): Stacked vertical layout */}
      <div className="lg:hidden h-full overflow-y-auto">
        <div className="flex flex-col space-y-5 pb-24">
          {/* Progress Hero */}
          <ProgressHero
            completedCount={completedCount}
            totalCount={totalCount}
            streak={profile.current_streak}
            weeklyTrend={weeklyTrend}
            remainingMinutes={remainingMinutes}
          />

          {/* Tasks Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Today's Focus
              </h2>
              {onOpenAddDialog && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenAddDialog}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                  aria-label="Add task"
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </Button>
              )}
            </div>
            {TasksContent}
          </div>

          {/* Calendar Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-4">
            {CalendarContent}
          </div>

          {/* Reminders Section */}
          <RemindersSection
            reminders={reminders}
            onComplete={onReminderComplete}
            onSkip={onReminderSkip}
            onUndoSkip={onReminderUndoSkip}
            onEdit={onReminderEdit}
            onDelete={onReminderDelete}
            onAddNew={onOpenAddReminderDialog}
          />
        </div>
      </div>

      {/* Desktop layout (>= 1024px): 60/40 split */}
      <div className="hidden lg:block pb-32">
        {/* Two-column layout: 60/40 split */}
        <div className="flex gap-6">
          {/* Left column - Progress + Tasks (60%) */}
          <div className="w-[60%] space-y-5">
            {/* Progress Module */}
            <ProgressDock
              completedCount={completedCount}
              totalCount={totalCount}
              streak={profile.current_streak}
              weeklyTrend={weeklyTrend}
              remainingMinutes={remainingMinutes}
            />

            {/* Tasks */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Today's Focus
                </h2>
                {onOpenAddDialog && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onOpenAddDialog}
                    className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                    aria-label="Add task"
                  >
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </Button>
                )}
              </div>

              {TasksContent}
            </div>
          </div>

          {/* Right column - Calendar + Reminders (40%) */}
          <div className="w-[40%] flex flex-col gap-5">
            {/* Calendar */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="p-4">
                {CalendarContent}
              </div>
            </div>

            {/* Reminders */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    Daily Reminders
                  </h2>
                  {onOpenAddReminderDialog && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onOpenAddReminderDialog}
                      className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                      aria-label="Add reminder"
                    >
                      <Plus className="h-5 w-5" aria-hidden="true" />
                    </Button>
                  )}
                </div>
                {RemindersContent}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

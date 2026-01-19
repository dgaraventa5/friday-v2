'use client';

import { Task, Profile, ReminderWithStatus, CalendarEventWithCalendar, ConnectedCalendar } from '@/lib/types';
import { getTodaysFocusTasks, addPriorityScores } from '@/lib/utils/task-prioritization';
import { TaskCard } from './task-card';
import { CelebrationState } from './celebration-state';
import { WelcomeMessage } from './welcome-message';
import { AddTaskGhost } from './add-task-ghost';
import { RemindersSection } from '@/components/reminders/reminders-section';
import { CalendarSection } from '@/components/calendar/calendar-section';
import { ProgressCard } from '@/components/today/progress-card';
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

          {incompleteTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
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

  // Reminders section content
  const RemindersContent = (
    <RemindersSection
      reminders={reminders}
      onComplete={onReminderComplete}
      onSkip={onReminderSkip}
      onUndoSkip={onReminderUndoSkip}
      onEdit={onReminderEdit}
      onDelete={onReminderDelete}
      onAddNew={onOpenAddReminderDialog}
    />
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

  // Progress card content
  const ProgressContent = (
    <ProgressCard
      completedCount={completedCount}
      totalCount={totalCount}
    />
  );

  return (
    <>
      {/* Mobile/Tablet layout (< 1024px): Stacked vertical layout */}
      <div className="lg:hidden h-full overflow-y-auto">
        <div className="flex flex-col space-y-6 pb-24">
          {/* Main Header */}
          <h1 className="text-2xl font-bold">Today's Focus</h1>

          {/* Tasks Section (Top priority) */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Tasks
              </h2>
              {onOpenAddDialog && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenAddDialog}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              )}
            </div>
            {TasksContent}
          </div>

          {/* Reminders Section */}
          {RemindersContent}

          {/* Calendar Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-4">
            {CalendarContent}
          </div>
        </div>
      </div>

      {/* Desktop layout (>= 1024px): Three-column layout */}
      <div className="hidden lg:flex lg:gap-6 h-full lg:pb-32">
        {/* Main column - Tasks (50%) */}
        <div className="flex-1 lg:w-[50%] h-full flex flex-col min-h-0">
          <h1 className="text-2xl font-bold mb-4 h-[2rem] flex items-center shrink-0">Today's Focus</h1>

          {/* Main Task Container - Constrained height */}
          <div className="flex-1 min-h-0 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Tasks
              </h2>
              {onOpenAddDialog && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenAddDialog}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
              {TasksContent}
            </div>
          </div>
        </div>

        {/* Center column - Calendar (25%) */}
        <div className="lg:w-[25%] lg:min-w-[240px] lg:max-w-[320px] flex flex-col pt-[3rem] h-full min-h-0">
          <div className="flex-1 min-h-0 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 flex flex-col overflow-hidden">
            <div className="p-4 flex-1 overflow-y-auto">
              {CalendarContent}
            </div>
          </div>
        </div>

        {/* Right column - Progress & Reminders (25%) */}
        <div className="lg:w-[25%] lg:min-w-[240px] lg:max-w-[320px] flex flex-col pt-[3rem] h-full min-h-0">
          <div className="flex flex-col gap-6 h-full min-h-0">
            <div className="shrink-0">
              {ProgressContent}
            </div>
            <div className="flex-1 min-h-0 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 flex flex-col overflow-hidden">
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    Reminders
                  </h2>
                  {onOpenAddReminderDialog && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onOpenAddReminderDialog}
                      className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  )}
                </div>
                {/* Reminders content - extracted from RemindersSection component for direct control over scrolling */}
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
                      hideHeader={true} // Add prop to hide internal header
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { Task, Profile, Reminder, ReminderCompletion, ReminderWithStatus } from '@/lib/types';
import { TodayView } from '@/components/today/today-view';
import { ScheduleView } from '@/components/schedule/schedule-view';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { AppHeader } from '@/components/dashboard/app-header';
import { DashboardDialogs } from '@/components/dashboard/dashboard-dialogs';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { createTasksService, createRemindersService } from '@/lib/services';
import { useTasks } from '@/hooks/use-tasks';
import { useReminders } from '@/hooks/use-reminders';
import { useDialogState } from '@/hooks/use-dialog-state';
import { useRecalibration } from '@/hooks/use-recalibration';
import { RecalibrationModal } from '@/components/recalibration/recalibration-modal';
import { PendingTaskChanges } from '@/lib/types';

interface DashboardClientProps {
  initialTasks: Task[];
  initialReminders: Reminder[];
  initialReminderCompletions: ReminderCompletion[];
  profile: Profile;
  userEmail?: string;
}

type NavView = 'today' | 'schedule';

export function DashboardClient({ 
  initialTasks, 
  initialReminders, 
  initialReminderCompletions, 
  profile,
  userEmail
}: DashboardClientProps) {
  const [currentView, setCurrentView] = useState<NavView>('today');

  const router = useRouter();
  const { toast } = useToast();

  const supabase = createBrowserClient();
  const tasksService = createTasksService(supabase);
  const remindersService = createRemindersService(supabase);

  // Use dialog state hook
  const {
    showAddTaskDialog,
    showAddReminderDialog,
    openAddTaskDialog,
    closeAddTaskDialog,
    openAddReminderDialog,
    closeAddReminderDialog,
    toggleAddTaskDialog,
    toggleAddReminderDialog,
  } = useDialogState();

  // Use the tasks hook for all task-related operations
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    pullToToday,
    editTask,
    isPulling,
    editingTask,
    setEditingTask,
    showEditDialog,
    setShowEditDialog,
  } = useTasks({
    initialTasks,
    tasksService,
    profile,
    toast,
  });

  // Use the reminders hook for all reminder-related operations
  const {
    reminders,
    reminderCompletions,
    todaysReminders,
    addReminder,
    completeReminder,
    skipReminder,
    undoSkipReminder,
    editReminder,
    updateReminder,
    deleteReminder,
    editingReminder,
    setEditingReminder,
    showEditReminderDialog,
    setShowEditReminderDialog,
  } = useReminders({
    initialReminders,
    initialReminderCompletions,
    remindersService,
    toast,
  });

  // Sync user's timezone to profile if not already set
  // This ensures server-side date calculations match the user's local timezone
  useEffect(() => {
    const syncTimezone = async () => {
      // Only sync if timezone is not set
      if (profile.timezone) return;

      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('[DashboardClient] Syncing timezone:', browserTimezone);

      try {
        const response = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timezone: browserTimezone }),
        });

        if (!response.ok) {
          console.error('[DashboardClient] Failed to sync timezone');
          return;
        }

        // Refresh to get updated profile with timezone
        router.refresh();
      } catch (error) {
        console.error('[DashboardClient] Error syncing timezone:', error);
      }
    };

    syncTimezone();
  }, [profile.timezone, router]);

  // Handler to persist recalibration dismissal to database (cross-device)
  const handleDismissRecalibration = async () => {
    try {
      const response = await fetch('/api/recalibration/dismiss', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to dismiss recalibration');
      }
      // Refresh to get updated profile with new dismissed date
      router.refresh();
    } catch (error) {
      console.error('[Recalibration] Failed to dismiss:', error);
      throw error;
    }
  };

  // Use the recalibration hook for daily task review
  const {
    isOpen: isRecalibrationOpen,
    setIsOpen: setRecalibrationOpen,
    skipToday: skipRecalibrationToday,
    snooze: snoozeRecalibration,
    openManually: openRecalibrationManually,
  } = useRecalibration(tasks, {
    triggerTime: profile.recalibration_time || '17:00:00',
    includeTomorrow: profile.recalibration_include_tomorrow ?? true,
    enabled: profile.recalibration_enabled ?? true,
    lastDismissedDate: profile.recalibration_last_dismissed_date ?? null,
    onDismiss: handleDismissRecalibration,
  });

  // Handle saving recalibration changes
  const handleRecalibrationSave = async (
    changes: Array<{ taskId: string; changes: PendingTaskChanges }>
  ) => {
    // Batch update tasks
    const updates = changes.map(({ taskId, changes: taskChanges }) => ({
      id: taskId,
      data: {
        ...(taskChanges.due_date && {
          due_date: taskChanges.due_date,
          start_date: taskChanges.due_date
        }),
        ...(taskChanges.importance && { importance: taskChanges.importance }),
        ...(taskChanges.urgency && { urgency: taskChanges.urgency }),
        updated_at: new Date().toISOString(),
      },
    }));

    const result = await tasksService.updateTasks(updates);

    if (result.error) {
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    // Trigger reschedule to update start_dates based on new priorities
    try {
      await fetch('/api/reschedule', { method: 'POST' });
    } catch (error) {
      console.error('[Recalibration] Failed to reschedule:', error);
    }

    // Refresh to get updated data
    router.refresh();

    toast({
      title: 'Tasks Updated',
      description: `${changes.length} task${changes.length > 1 ? 's' : ''} recalibrated successfully.`,
    });
  };

  // Handle task completion during recalibration (immediate, not batched)
  const handleRecalibrationTaskComplete = (taskId: string) => {
    // Use existing toggle complete with skipAutoSchedule=true to prevent
    // immediate rescheduling (user is still in recalibration flow)
    toggleComplete(taskId, true);
  };

  return (
    <div className="flex h-dvh flex-col bg-background overflow-hidden">
      <AppHeader
        tasks={tasks}
        profile={profile}
        userEmail={userEmail}
        onOpenRecalibration={openRecalibrationManually}
      />
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          {currentView === 'today' ? (
            <TodayView
              tasks={tasks}
              profile={profile}
              reminders={todaysReminders}
              onTaskComplete={toggleComplete}
              onTaskEdit={editTask}
              onTaskDelete={deleteTask}
              onPullTaskToToday={pullToToday}
              onOpenAddDialog={openAddTaskDialog}
              onReminderComplete={completeReminder}
              onReminderSkip={skipReminder}
              onReminderUndoSkip={undoSkipReminder}
              onReminderEdit={editReminder}
              onReminderDelete={deleteReminder}
              onOpenAddReminderDialog={openAddReminderDialog}
            />
          ) : (
            <ScheduleView
              tasks={tasks}
              onTaskComplete={toggleComplete}
              onTaskEdit={editTask}
              onTaskDelete={deleteTask}
            />
          )}
        </div>
      </main>

      <BottomNav
        currentView={currentView}
        onViewChange={setCurrentView}
        onAddTask={openAddTaskDialog}
      />

      <DashboardDialogs
        showAddTaskDialog={showAddTaskDialog}
        toggleAddTaskDialog={toggleAddTaskDialog}
        closeAddTaskDialog={closeAddTaskDialog}
        addTask={addTask}
        editingTask={editingTask}
        showEditDialog={showEditDialog}
        setShowEditDialog={setShowEditDialog}
        updateTask={updateTask}
        showAddReminderDialog={showAddReminderDialog}
        toggleAddReminderDialog={toggleAddReminderDialog}
        closeAddReminderDialog={closeAddReminderDialog}
        addReminder={addReminder}
        editingReminder={editingReminder}
        showEditReminderDialog={showEditReminderDialog}
        setShowEditReminderDialog={setShowEditReminderDialog}
        updateReminder={updateReminder}
      />

      <RecalibrationModal
        tasks={tasks}
        profile={profile}
        isOpen={isRecalibrationOpen}
        onOpenChange={setRecalibrationOpen}
        onSaveChanges={handleRecalibrationSave}
        onTaskComplete={handleRecalibrationTaskComplete}
        onSkipToday={skipRecalibrationToday}
        onSnooze={snoozeRecalibration}
      />
    </div>
  );
}

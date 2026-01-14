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

  return (
    <div className="flex h-dvh flex-col bg-background overflow-hidden">
      <AppHeader tasks={tasks} profile={profile} userEmail={userEmail} />
      
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
      
    </div>
  );
}

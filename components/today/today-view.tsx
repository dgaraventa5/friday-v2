'use client';

import { useState } from 'react';
import { Task, Profile } from '@/lib/types';
import { getTodaysFocusTasks } from '@/lib/utils/task-prioritization';
import { TodayHeader } from './today-header';
import { TaskCard } from './task-card';
import { CelebrationState } from './celebration-state';
import { WelcomeMessage } from './welcome-message';
import { AddAnotherTaskDialog } from './add-another-task-dialog';
import { SelectTaskDialog } from './select-task-dialog';
import { getTodayLocal } from '@/lib/utils/date-utils';

interface TodayViewProps {
  tasks: Task[];
  profile: Profile;
  onTaskComplete: (taskId: string, skipAutoSchedule?: boolean) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onPullTaskToToday?: (taskId: string) => void;
  onOpenAddDialog?: () => void;
}

const BASELINE_TASKS = 4;

export function TodayView({ 
  tasks, 
  profile, 
  onTaskComplete, 
  onTaskEdit, 
  onTaskDelete,
  onPullTaskToToday,
  onOpenAddDialog,
}: TodayViewProps) {
  const [showAddAnotherDialog, setShowAddAnotherDialog] = useState(false);
  const [showSelectTaskDialog, setShowSelectTaskDialog] = useState(false);
  const [completedTask, setCompletedTask] = useState<Task | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [declineCount, setDeclineCount] = useState(0);

  const focusTasks = getTodaysFocusTasks(tasks);
  const incompleteTasks = focusTasks.filter(t => !t.completed);
  const completedTasks = focusTasks.filter(t => t.completed);
  
  const completedCount = completedTasks.length;
  const totalTasks = incompleteTasks.length + completedTasks.length;
  const allComplete = incompleteTasks.length === 0 && completedTasks.length > 0;
  
  const isExtraCredit = completedCount > BASELINE_TASKS;
  const totalToShow = BASELINE_TASKS; // Always show "of 4"

  const handleTaskComplete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    // If user has declined 2+ times, skip auto-scheduling
    if (declineCount >= 2) {
      onTaskComplete(taskId, true);
      return;
    }

    // Show "add another" prompt and store the task ID
    setPendingTaskId(taskId);
    setCompletedTask(task);
    setShowAddAnotherDialog(true);
  };

  const handleAddAnotherYes = () => {
    setShowAddAnotherDialog(false);
    setDeclineCount(0);
    // Complete the task but skip auto-scheduling since user wants to manually select
    if (pendingTaskId) {
      onTaskComplete(pendingTaskId, true);
      setPendingTaskId(null);
    }
    setShowSelectTaskDialog(true);
  };

  const handleAddAnotherNo = () => {
    setShowAddAnotherDialog(false);
    setDeclineCount(prev => prev + 1);
    // Complete the task but skip auto-scheduling
    if (pendingTaskId) {
      onTaskComplete(pendingTaskId, true);
      setPendingTaskId(null);
    }
  };

  const handleSelectTask = (taskId: string) => {
    setShowSelectTaskDialog(false);
    if (onPullTaskToToday) {
      onPullTaskToToday(taskId);
    }
  };

  const handleCreateNew = () => {
    setShowSelectTaskDialog(false);
    if (onOpenAddDialog) {
      onOpenAddDialog();
    }
  };

  const todayStr = getTodayLocal();
  const availableTasks = tasks.filter(
    t => !t.completed && 
         !t.is_recurring && 
         t.start_date && 
         t.start_date > todayStr
  );

  // Show welcome message if no tasks and onboarding not complete
  if (tasks.length === 0 && !profile.onboarding_completed) {
    return <WelcomeMessage />;
  }

  return (
    <>
      <div className="flex flex-col space-y-4 md:space-y-6">
        <TodayHeader
          completedCount={completedCount}
          totalCount={totalToShow}
          currentStreak={profile.current_streak}
          isExtraCredit={isExtraCredit}
        />

        <div className="space-y-3 md:space-y-4">
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

              {declineCount >= 2 && availableTasks.length > 0 && (
                <button
                  onClick={() => setShowSelectTaskDialog(true)}
                  className="w-full p-3 md:p-4 border border-dashed rounded-lg text-sm md:text-base text-muted-foreground hover:bg-accent transition-colors"
                >
                  Want to add more? Pull a task from your schedule
                </button>
              )}
            </>
          )}

          {completedTasks.length > 0 && (
            <div className="pt-4 md:pt-6 space-y-3 md:space-y-4">
              <h3 className="text-sm md:text-base font-medium text-muted-foreground px-1">
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
      </div>

      <AddAnotherTaskDialog
        open={showAddAnotherDialog}
        onOpenChange={(open) => {
          setShowAddAnotherDialog(open);
          // If dialog is closed without selecting, complete task with skipAutoSchedule
          if (!open && pendingTaskId) {
            onTaskComplete(pendingTaskId, true);
            setPendingTaskId(null);
          }
        }}
        completedTask={completedTask}
        onYes={handleAddAnotherYes}
        onNo={handleAddAnotherNo}
      />

      <SelectTaskDialog
        open={showSelectTaskDialog}
        onOpenChange={setShowSelectTaskDialog}
        availableTasks={availableTasks}
        onSelectTask={handleSelectTask}
        onCreateNew={handleCreateNew}
      />
    </>
  );
}

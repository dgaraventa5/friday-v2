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
  onTaskComplete: (taskId: string) => void;
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
    if (task && !task.completed && declineCount < 2) {
      // Show "add another" prompt after completing a task
      setCompletedTask(task);
      setShowAddAnotherDialog(true);
    }
    onTaskComplete(taskId);
  };

  const handleAddAnotherYes = () => {
    setShowAddAnotherDialog(false);
    setDeclineCount(0);
    setShowSelectTaskDialog(true);
  };

  const handleAddAnotherNo = () => {
    setShowAddAnotherDialog(false);
    setDeclineCount(prev => prev + 1);
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
      <div className="flex flex-col h-full">
        <TodayHeader
          completedCount={completedCount}
          totalCount={totalToShow}
          currentStreak={profile.current_streak}
          isExtraCredit={isExtraCredit}
        />

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {allComplete ? (
            <CelebrationState 
              completedCount={completedCount} 
              baselineCount={BASELINE_TASKS}
            />
          ) : (
            <>
              {incompleteTasks.length === 0 && completedTasks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg">No tasks scheduled for today</p>
                  <p className="text-sm mt-2">Add a task to get started</p>
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
                  className="w-full p-3 border border-dashed rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors"
                >
                  Want to add more? Pull a task from your schedule
                </button>
              )}
            </>
          )}

          {completedTasks.length > 0 && (
            <div className="pt-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground px-1">
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
        onOpenChange={setShowAddAnotherDialog}
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

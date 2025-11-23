'use client';

import { useState } from 'react';
import { Task, Profile } from '@/lib/types';
import { getTodaysFocusTasks, addPriorityScores } from '@/lib/utils/task-prioritization';
import { TaskCard } from './task-card';
import { CelebrationState } from './celebration-state';
import { WelcomeMessage } from './welcome-message';
import { AddAnotherTaskDialog } from './add-another-task-dialog';
import { getTodayLocal } from '@/lib/utils/date-utils';
import { useToast } from '@/hooks/use-toast';

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
  const [completedTask, setCompletedTask] = useState<Task | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [declineCount, setDeclineCount] = useState(0);
  const { toast } = useToast();

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
    if (!task) return;

    // If task is already completed, allow unchecking without dialog
    if (task.completed) {
      onTaskComplete(taskId, true);
      return;
    }

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

  const handleAddAnotherYes = async () => {
    setShowAddAnotherDialog(false);
    setDeclineCount(0);
    
    // Complete the pending task (await to prevent race condition)
    if (pendingTaskId) {
      await onTaskComplete(pendingTaskId, true);
      setPendingTaskId(null);
    }
    
    // Auto-pull the next highest priority task
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

  const handleAddAnotherNo = () => {
    setShowAddAnotherDialog(false);
    setDeclineCount(prev => prev + 1);
    // Complete the task but skip auto-scheduling
    if (pendingTaskId) {
      onTaskComplete(pendingTaskId, true);
      setPendingTaskId(null);
    }
  };


  // Show welcome message if no tasks and onboarding not complete
  if (tasks.length === 0 && !profile.onboarding_completed) {
    return <WelcomeMessage />;
  }

  return (
    <>
      <div className="flex flex-col space-y-4 md:space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">Today's Focus</h1>

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
    </>
  );
}

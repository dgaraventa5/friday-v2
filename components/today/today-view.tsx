'use client';

import { Task, Profile } from '@/lib/types';
import { getTodaysFocusTasks, addPriorityScores } from '@/lib/utils/task-prioritization';
import { TaskCard } from './task-card';
import { CelebrationState } from './celebration-state';
import { WelcomeMessage } from './welcome-message';
import { AddTaskGhost } from './add-task-ghost';
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
  const { toast } = useToast();

  const focusTasks = getTodaysFocusTasks(tasks);
  const incompleteTasks = focusTasks.filter(t => !t.completed);
  const completedTasks = focusTasks.filter(t => t.completed);
  
  const completedCount = completedTasks.length;
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

  return (
    <>
      <div className="flex flex-col space-y-3 md:space-y-4 lg:space-y-6">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Today's Focus</h1>

        <div className="space-y-2 md:space-y-3 lg:space-y-4">
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
            <div className="pt-3 md:pt-4 lg:pt-6 space-y-2 md:space-y-3 lg:space-y-4">
              <h3 className="text-xs md:text-sm lg:text-base font-medium text-muted-foreground px-1">
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
    </>
  );
}

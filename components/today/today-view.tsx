'use client';

import { Task, Profile } from '@/lib/types';
import { getTodaysFocusTasks } from '@/lib/utils/task-prioritization';
import { TodayHeader } from './today-header';
import { TaskCard } from './task-card';
import { CelebrationState } from './celebration-state';
import { WelcomeMessage } from './welcome-message';

interface TodayViewProps {
  tasks: Task[];
  profile: Profile;
  onTaskComplete: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

export function TodayView({ 
  tasks, 
  profile, 
  onTaskComplete, 
  onTaskEdit, 
  onTaskDelete 
}: TodayViewProps) {
  const focusTasks = getTodaysFocusTasks(tasks);
  const incompleteTasks = focusTasks.filter(t => !t.completed);
  const completedTasks = focusTasks.filter(t => t.completed);
  
  const totalFocusTasks = Math.min(incompleteTasks.length, 4);
  const completedCount = completedTasks.length;
  const allComplete = incompleteTasks.length === 0 && completedTasks.length > 0;

  // Show welcome message if no tasks and onboarding not complete
  if (tasks.length === 0 && !profile.onboarding_completed) {
    return <WelcomeMessage />;
  }

  return (
    <div className="flex flex-col h-full">
      <TodayHeader
        completedCount={completedCount}
        totalCount={totalFocusTasks + completedCount}
        currentStreak={profile.current_streak}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {allComplete ? (
          <CelebrationState completedCount={completedCount} />
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
                onComplete={onTaskComplete}
                onEdit={onTaskEdit}
                onDelete={onTaskDelete}
              />
            ))}
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
                onComplete={onTaskComplete}
                onEdit={onTaskEdit}
                onDelete={onTaskDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

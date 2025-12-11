'use client';

import { Task } from '@/lib/types';
import { addPriorityScores, getTodaysFocusTasks } from '@/lib/utils/task-prioritization';
import { getTodayLocal, formatDateLocal, parseDateLocal } from '@/lib/utils/date-utils';
import { TaskCard } from '@/components/today/task-card';
import { Calendar } from 'lucide-react';

interface ScheduleViewProps {
  tasks: Task[];
  onTaskComplete: (taskId: string, skipAutoSchedule?: boolean) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

export function ScheduleView({ 
  tasks, 
  onTaskComplete, 
  onTaskEdit, 
  onTaskDelete 
}: ScheduleViewProps) {
  const groupedTasks = new Map<string, { incomplete: Task[]; completed: Task[] }>();
  
  const todayStr = getTodayLocal();
  
  // For today, use getTodaysFocusTasks which enforces the 4-task cap
  const todaysTasks = getTodaysFocusTasks(tasks);
  const todaysTaskIds = new Set(todaysTasks.map(t => t.id));

  for (const task of tasks) {
    if (!task.start_date) continue;
    
    // Skip past incomplete recurring tasks - we only show current/future instances
    if (task.is_recurring && !task.completed && task.start_date < todayStr) {
      continue;
    }
    
    const date = task.start_date;
    const isToday = date === todayStr;
    
    // For today, only include tasks that passed the 4-task cap filter
    if (isToday && !todaysTaskIds.has(task.id)) {
      continue;
    }
    
    if (!groupedTasks.has(date)) {
      groupedTasks.set(date, { incomplete: [], completed: [] });
    }
    const bucket = groupedTasks.get(date)!;

    if (task.completed && isToday) {
      bucket.completed.push(task);
    } else if (!task.completed) {
      bucket.incomplete.push(task);
    }
  }
  
  const sortedDates = Array.from(groupedTasks.entries())
    .filter(([_, tasksForDate]) => tasksForDate.incomplete.length > 0 || tasksForDate.completed.length > 0)
    .map(([date]) => date)
    .sort();

  console.log('[v1] ScheduleView - grouped dates:', sortedDates);
  console.log('[v1] ScheduleView - today (local):', todayStr);
  console.log('[v1] ScheduleView - today tasks capped at:', todaysTasks.length);

  if (sortedDates.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 py-12 md:py-20 text-center">
        <Calendar className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
        <h3 className="text-base md:text-lg font-medium mb-2">No Scheduled Tasks</h3>
        <p className="text-sm md:text-base text-muted-foreground max-w-sm text-pretty">
          Add tasks and they'll be automatically scheduled based on priority and capacity.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-3 md:space-y-4 lg:space-y-6 pb-24 lg:pb-0">
        <div className="px-3 py-3 md:px-4 md:py-4 lg:px-6 lg:py-6 bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Schedule</h1>
          <p className="text-xs md:text-sm lg:text-base text-muted-foreground mt-1 md:mt-1.5 lg:mt-2">
            Your upcoming tasks organized by date
          </p>
        </div>

        <div className="space-y-4 md:space-y-6 lg:space-y-8">
          {sortedDates.map((dateStr) => {
          const dateTasks = groupedTasks.get(dateStr)!;
          
          const incompleteTasks = addPriorityScores(dateTasks.incomplete).sort(
            (a, b) => b.priorityScore - a.priorityScore
          );
          
          const completedTasks = [...dateTasks.completed].sort((a, b) => {
            if (a.completed_at && b.completed_at) {
              return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
            }
            if (a.completed_at) return -1;
            if (b.completed_at) return 1;
            return a.title.localeCompare(b.title);
          });
          const isToday = dateStr === todayStr;
          const isTomorrow = dateStr === formatDateLocal(new Date(Date.now() + 24 * 60 * 60 * 1000));
          
          const taskDate = parseDateLocal(dateStr);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isPast = taskDate < today && !isToday;

          console.log('[v1] ScheduleView date:', dateStr, 'isToday:', isToday, 'tasks:', [
            ...dateTasks.incomplete.map(t => t.title),
            ...dateTasks.completed.map(t => t.title),
          ]);

          let dateLabel = taskDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          });

          if (isToday) dateLabel = `Today, ${dateLabel}`;
          if (isTomorrow) dateLabel = `Tomorrow, ${dateLabel}`;

          return (
            <div key={dateStr} className="space-y-2 md:space-y-3 lg:space-y-4">
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 lg:gap-3">
                <h2 className="text-sm md:text-base lg:text-lg font-semibold">{dateLabel}</h2>
                <span className="text-xs md:text-sm text-muted-foreground">
                   {(dateTasks.incomplete.length + dateTasks.completed.length)} task{(dateTasks.incomplete.length + dateTasks.completed.length) !== 1 ? 's' : ''}
                </span>
                {isPast && (
                  <span className="text-xs md:text-sm px-2 py-0.5 md:py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    Overdue
                  </span>
                )}
              </div>


              <div className="space-y-2 md:space-y-2.5 lg:space-y-3">
                {incompleteTasks.map((task) => (

                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={onTaskComplete}
                    onEdit={onTaskEdit}
                    onDelete={onTaskDelete}
                  />
                ))}
              </div>
              
              {isToday && completedTasks.length > 0 && (
                <div className="space-y-2 md:space-y-2.5 lg:space-y-3 pt-2 md:pt-2.5 lg:pt-3">
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
          );
        })}
        </div>
      </div>
    </div>
  );
}

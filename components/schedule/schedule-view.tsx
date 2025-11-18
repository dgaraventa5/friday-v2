'use client';

import { Task } from '@/lib/types';
import { addPriorityScores } from '@/lib/utils/task-prioritization';
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

  for (const task of tasks) {
    if (!task.start_date) continue;
    const date = task.start_date;
    if (!groupedTasks.has(date)) {
      groupedTasks.set(date, { incomplete: [], completed: [] });
    }
    const bucket = groupedTasks.get(date)!;
    const isToday = date === todayStr;

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

  console.log('[v0] ScheduleView - grouped dates:', sortedDates);
  console.log('[v0] ScheduleView - today (local):', todayStr);

  if (sortedDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Scheduled Tasks</h3>
        <p className="text-sm text-muted-foreground max-w-sm text-pretty">
          Add tasks and they'll be automatically scheduled based on priority and capacity.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-4 border-b bg-slate-50 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your upcoming tasks organized by date
        </p>
      </div>

      <div className="p-4 space-y-6">
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

          console.log('[v0] ScheduleView date:', dateStr, 'isToday:', isToday, 'tasks:', [
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
            <div key={dateStr} className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">{dateLabel}</h2>
                <span className="text-sm text-muted-foreground">
                  {(dateTasks.incomplete.length + dateTasks.completed.length)} task{(dateTasks.incomplete.length + dateTasks.completed.length) !== 1 ? 's' : ''}
                </span>
                {isPast && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    Overdue
                  </span>
                )}
              </div>

              <div className="space-y-2">
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
                <div className="space-y-2 pt-2">
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
  );
}

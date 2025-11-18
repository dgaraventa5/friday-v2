'use client';

import { Task } from '@/lib/types';
import { groupTasksByDate } from '@/lib/utils/task-prioritization';
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
  const groupedTasks = groupTasksByDate(tasks);
  const sortedDates = Array.from(groupedTasks.keys()).sort();

  const todayStr = getTodayLocal();

  console.log('[v0] ScheduleView - grouped dates:', sortedDates);
  console.log('[v0] ScheduleView - today (local):', todayStr);

  if (sortedDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12 md:py-20 text-center">
        <Calendar className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
        <h3 className="text-base md:text-lg font-medium mb-2">No Scheduled Tasks</h3>
        <p className="text-sm md:text-base text-muted-foreground max-w-sm text-pretty">
          Add tasks and they'll be automatically scheduled based on priority and capacity.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="px-4 py-4 md:px-6 md:py-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border">
        <h1 className="text-xl md:text-3xl font-bold">Schedule</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
          Your upcoming tasks organized by date
        </p>
      </div>

      <div className="space-y-6 md:space-y-8">
        {sortedDates.map((dateStr) => {
          const dateTasks = groupedTasks.get(dateStr)!;
          const isToday = dateStr === todayStr;
          const isTomorrow = dateStr === formatDateLocal(new Date(Date.now() + 24 * 60 * 60 * 1000));
          
          const taskDate = parseDateLocal(dateStr);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isPast = taskDate < today && !isToday;

          console.log('[v0] ScheduleView date:', dateStr, 'isToday:', isToday, 'tasks:', dateTasks.map(t => t.title));

          let dateLabel = taskDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          });

          if (isToday) dateLabel = `Today, ${dateLabel}`;
          if (isTomorrow) dateLabel = `Tomorrow, ${dateLabel}`;

          return (
            <div key={dateStr} className="space-y-3 md:space-y-4">
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <h2 className="text-base md:text-lg font-semibold">{dateLabel}</h2>
                <span className="text-xs md:text-sm text-muted-foreground">
                  {dateTasks.length} task{dateTasks.length !== 1 ? 's' : ''}
                </span>
                {isPast && (
                  <span className="text-xs md:text-sm px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    Overdue
                  </span>
                )}
              </div>

              <div className="space-y-2 md:space-y-3">
                {dateTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={onTaskComplete}
                    onEdit={onTaskEdit}
                    onDelete={onTaskDelete}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

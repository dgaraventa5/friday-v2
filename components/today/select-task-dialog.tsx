'use client';

import { Task } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Calendar } from 'lucide-react';
import { addPriorityScores } from '@/lib/utils/task-prioritization';
import { getTodayLocal, formatDateStringForDisplay } from '@/lib/utils/date-utils';

interface SelectTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableTasks: Task[];
  onSelectTask: (taskId: string) => void;
  onCreateNew: () => void;
}

export function SelectTaskDialog({
  open,
  onOpenChange,
  availableTasks,
  onSelectTask,
  onCreateNew,
}: SelectTaskDialogProps) {
  // Score and sort tasks by priority
  const scoredTasks = addPriorityScores(availableTasks);
  scoredTasks.sort((a, b) => b.priorityScore - a.priorityScore);
  const topTasks = scoredTasks.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pull a task into today's focus</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {topTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No upcoming tasks available</p>
              <p className="text-xs mt-2">Create a new task to add to today</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Select a task from your upcoming schedule:
              </p>
              
              {topTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  className="w-full p-3 text-left border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="font-medium mb-1">{task.title}</div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {task.estimated_hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.estimated_hours}h
                      </span>
                    )}
                    {task.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateStringForDisplay(task.start_date, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-muted rounded-full text-xs">
                      {task.quadrant === 'urgent-important' && 'Critical'}
                      {task.quadrant === 'not-urgent-important' && 'Plan'}
                      {task.quadrant === 'urgent-not-important' && 'Urgent'}
                      {task.quadrant === 'not-urgent-not-important' && 'Backlog'}
                    </span>
                  </div>
                </button>
              ))}
            </>
          )}

          <Button
            onClick={onCreateNew}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

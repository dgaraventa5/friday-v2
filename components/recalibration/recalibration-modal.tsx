'use client';

import { useState } from 'react';
import { Task, Profile, PendingTaskChanges } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RecalibrationSection } from './recalibration-section';
import { RecalibrationTaskCard } from './recalibration-task-card';
import { useRecalibration } from '@/hooks/use-recalibration';
import { Sunrise } from 'lucide-react';

interface RecalibrationModalProps {
  tasks: Task[];
  profile: Profile;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveChanges: (
    changes: Array<{ taskId: string; changes: PendingTaskChanges }>
  ) => Promise<void>;
  onTaskComplete: (taskId: string) => void;
  onSkipToday: () => void;
}

export function RecalibrationModal({
  tasks,
  profile,
  isOpen,
  onOpenChange,
  onSaveChanges,
  onTaskComplete,
  onSkipToday,
}: RecalibrationModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const {
    visibleTasks,
    totalTaskCount,
    pendingChanges,
    reviewedTaskIds,
    updateTaskChanges,
    markTaskReviewed,
    hideTask,
    hasChanges,
    getAllPendingChanges,
  } = useRecalibration(tasks, {
    triggerTime: profile.recalibration_time || '17:00:00',
    includeTomorrow: profile.recalibration_include_tomorrow ?? true,
    enabled: profile.recalibration_enabled ?? true,
  });

  const handleDone = async () => {
    if (hasChanges) {
      setIsSaving(true);
      try {
        await onSaveChanges(getAllPendingChanges());
      } finally {
        setIsSaving(false);
      }
    }
    onSkipToday();
  };

  const handleTaskComplete = (taskId: string) => {
    onTaskComplete(taskId);
    hideTask(taskId);
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    }
  };

  const handleToggleExpand = (taskId: string) => {
    setExpandedTaskId(prev => prev === taskId ? null : taskId);
  };

  const handleMarkReviewed = (taskId: string) => {
    markTaskReviewed(taskId);
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    }
  };

  // Empty state
  if (totalTaskCount === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="dialog-sheet max-w-lg">
          <div className="text-center py-8">
            <div className="text-4xl mb-4">&#10024;</div>
            <h2 className="text-xl font-semibold mb-2">All caught up!</h2>
            <p className="text-muted-foreground mb-6">
              No tasks need your attention right now. Great job staying on top
              of things!
            </p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-sheet max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sunrise className="h-5 w-5 text-amber-500" aria-hidden="true" />
            Daily Recalibration
          </DialogTitle>
          <DialogDescription>
            {totalTaskCount} {totalTaskCount === 1 ? 'task' : 'tasks'} to review
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable task list */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {visibleTasks.overdue.length > 0 && (
            <RecalibrationSection
              title="Overdue"
              count={visibleTasks.overdue.length}
              variant="warning"
            >
              {visibleTasks.overdue.map((task) => (
                <RecalibrationTaskCard
                  key={task.id}
                  task={task}
                  pendingChanges={pendingChanges.get(task.id)}
                  isReviewed={reviewedTaskIds.has(task.id)}
                  isExpanded={expandedTaskId === task.id}
                  onToggleExpand={() => handleToggleExpand(task.id)}
                  onUpdateChanges={(changes) =>
                    updateTaskChanges(task.id, changes)
                  }
                  onComplete={() => handleTaskComplete(task.id)}
                  onHide={() => hideTask(task.id)}
                  onMarkReviewed={() => handleMarkReviewed(task.id)}
                />
              ))}
            </RecalibrationSection>
          )}

          {visibleTasks.dueToday.length > 0 && (
            <RecalibrationSection
              title="Due Today"
              count={visibleTasks.dueToday.length}
              variant="default"
            >
              {visibleTasks.dueToday.map((task) => (
                <RecalibrationTaskCard
                  key={task.id}
                  task={task}
                  pendingChanges={pendingChanges.get(task.id)}
                  isReviewed={reviewedTaskIds.has(task.id)}
                  isExpanded={expandedTaskId === task.id}
                  onToggleExpand={() => handleToggleExpand(task.id)}
                  onUpdateChanges={(changes) =>
                    updateTaskChanges(task.id, changes)
                  }
                  onComplete={() => handleTaskComplete(task.id)}
                  onHide={() => hideTask(task.id)}
                  onMarkReviewed={() => handleMarkReviewed(task.id)}
                />
              ))}
            </RecalibrationSection>
          )}

          {visibleTasks.dueTomorrow.length > 0 && (
            <RecalibrationSection
              title="Tomorrow"
              count={visibleTasks.dueTomorrow.length}
              variant="muted"
              defaultCollapsed
            >
              {visibleTasks.dueTomorrow.map((task) => (
                <RecalibrationTaskCard
                  key={task.id}
                  task={task}
                  pendingChanges={pendingChanges.get(task.id)}
                  isReviewed={reviewedTaskIds.has(task.id)}
                  isExpanded={expandedTaskId === task.id}
                  onToggleExpand={() => handleToggleExpand(task.id)}
                  onUpdateChanges={(changes) =>
                    updateTaskChanges(task.id, changes)
                  }
                  onComplete={() => handleTaskComplete(task.id)}
                  onHide={() => hideTask(task.id)}
                  onMarkReviewed={() => handleMarkReviewed(task.id)}
                />
              ))}
            </RecalibrationSection>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t pt-3 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onSkipToday}
          >
            Skip Today
          </Button>
          <Button
            className="flex-1"
            onClick={handleDone}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Done'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

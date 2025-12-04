'use client';

import { useState, useEffect } from 'react';
import { Task, Profile } from '@/lib/types';
import { TodayView } from '@/components/today/today-view';
import { ScheduleView } from '@/components/schedule/schedule-view';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { AppHeader } from '@/components/dashboard/app-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddTaskForm } from '@/components/task/add-task-form';
import { EditTaskDialog } from '@/components/task/edit-task-dialog';
import { createBrowserClient } from '@/lib/supabase/client';
import { assignStartDates } from '@/lib/utils/task-prioritization';
import { generateNextRecurringInstance } from '@/lib/utils/recurring-tasks';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getTodayLocal } from '@/lib/utils/date-utils';
import { cn } from '@/lib/utils';

interface DashboardClientProps {
  initialTasks: Task[];
  profile: Profile;
  userEmail?: string;
}

type NavView = 'today' | 'schedule';

export function DashboardClient({ initialTasks, profile, userEmail }: DashboardClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [currentView, setCurrentView] = useState<NavView>('today');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const supabase = createBrowserClient();

  useEffect(() => {
    const runInitialScheduling = async () => {
      console.log('[v0] Running initial scheduling for all tasks');
      console.log('[v0] Profile data:', {
        category_limits: profile.category_limits,
        daily_max_hours: profile.daily_max_hours,
        daily_max_tasks: profile.daily_max_tasks,
        daily_max_tasks_type: typeof profile.daily_max_tasks,
        daily_max_tasks_is_null: profile.daily_max_tasks === null,
        daily_max_tasks_is_undefined: profile.daily_max_tasks === undefined,
      });
      
      // Improve null/undefined handling for daily_max_tasks
      const dailyMaxTasks = profile.daily_max_tasks && 
        typeof profile.daily_max_tasks === 'object' &&
        'weekday' in profile.daily_max_tasks &&
        'weekend' in profile.daily_max_tasks &&
        typeof profile.daily_max_tasks.weekday === 'number' &&
        typeof profile.daily_max_tasks.weekend === 'number'
          ? profile.daily_max_tasks
          : { weekday: 4, weekend: 4 };
      
      console.log('[v0] Using daily_max_tasks:', dailyMaxTasks);
      
      const schedulingResult = assignStartDates(
        tasks,
        profile.category_limits,
        profile.daily_max_hours,
        dailyMaxTasks
      );
      
      // Find tasks that need database updates
      const tasksToUpdate = schedulingResult.rescheduledTasks
        .filter(({ newDate }) => newDate !== null);
      
      if (tasksToUpdate.length > 0) {
        console.log('[v0] Updating', tasksToUpdate.length, 'tasks with new start dates');
        
        await Promise.all(
          tasksToUpdate.map(({ task }) =>
            supabase
              .from('tasks')
              .update({ start_date: task.start_date })
              .eq('id', task.id)
          )
        );
      }
      
      setTasks(schedulingResult.tasks);
      
      // Show warnings if any
      if (schedulingResult.warnings.length > 0) {
        toast({
          title: 'Scheduling Warning',
          description: schedulingResult.warnings[0],
          variant: 'destructive',
        });
      }
    };
    
    runInitialScheduling();
  }, []);

  const handleTaskAdded = async (newTasks: Task | Task[]) => {
    const tasksArray = Array.isArray(newTasks) ? newTasks : [newTasks];
    console.log('[v0] handleTaskAdded called with', tasksArray.length, 'tasks');
    
    // Add new tasks to state
    const updatedTaskList = [...tasks, ...tasksArray];
    
    // Run full scheduling
    const dailyMaxTasks = profile.daily_max_tasks && 
      typeof profile.daily_max_tasks === 'object' &&
      'weekday' in profile.daily_max_tasks &&
      'weekend' in profile.daily_max_tasks &&
      typeof profile.daily_max_tasks.weekday === 'number' &&
      typeof profile.daily_max_tasks.weekend === 'number'
        ? profile.daily_max_tasks
        : { weekday: 4, weekend: 4 };
        
    const schedulingResult = assignStartDates(
      updatedTaskList,
      profile.category_limits,
      profile.daily_max_hours,
      dailyMaxTasks
    );
    
    // Update all tasks with new start_dates
    const tasksToUpdate = schedulingResult.rescheduledTasks
      .filter(({ newDate }) => newDate !== null);
    
    if (tasksToUpdate.length > 0) {
      console.log('[v0] Updating', tasksToUpdate.length, 'tasks in database');
      
      await Promise.all(
        tasksToUpdate.map(({ task }) =>
          supabase
            .from('tasks')
            .update({ start_date: task.start_date })
            .eq('id', task.id)
        )
      );
      
      // Show notification about rescheduled tasks
      const rescheduledCount = schedulingResult.rescheduledTasks.filter(
        ({ task }) => !tasksArray.some(t => t.id === task.id) // Exclude newly added tasks
      ).length;
      
      if (rescheduledCount > 0) {
        toast({
          title: 'Tasks Rescheduled',
          description: `${rescheduledCount} task${rescheduledCount > 1 ? 's were' : ' was'} moved to optimize your schedule.`,
        });
      }
    }
    
    setTasks(schedulingResult.tasks);
    setShowAddDialog(false);
    
    // Show warnings
    if (schedulingResult.warnings.length > 0) {
      toast({
        title: 'Scheduling Warning',
        description: schedulingResult.warnings[0],
        variant: 'destructive',
      });
    }
    
    setTimeout(() => {
      router.refresh();
    }, 500);
  };

  const handleTaskComplete = async (taskId: string, skipAutoSchedule: boolean = false) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompletedState = !task.completed;
    const todayStr = getTodayLocal();
    
    // If completing a task scheduled for the future, move it to today
    // This ensures it shows as "Completed Today" in both Schedule and Today views
    const shouldMoveToToday = newCompletedState && task.start_date && task.start_date > todayStr;

    // Optimistic update
    const updatedTasks = tasks.map(t => 
      t.id === taskId 
        ? { 
            ...t, 
            completed: newCompletedState, 
            completed_at: newCompletedState ? new Date().toISOString() : null,
            ...(shouldMoveToToday && { start_date: todayStr })
          }
        : t
    );

    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          completed: newCompletedState,
          completed_at: newCompletedState ? new Date().toISOString() : null,
          ...(shouldMoveToToday && { start_date: todayStr })
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      if (newCompletedState) {
        // Task was completed - update streak
        await fetch('/api/streak', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update' })
        });
        
        // Handle recurring task next instance
        if (task.is_recurring) {
          const nextInstance = generateNextRecurringInstance(task);
          if (nextInstance) {
            // Check if instance already exists for this date + series (prevent duplicates)
            const existingInstance = updatedTasks.find(
              t => t.recurring_series_id === task.recurring_series_id &&
                   t.start_date === nextInstance.start_date &&
                   !t.completed
            );
            
            if (!existingInstance) {
              const { data, error: insertError } = await supabase
                .from('tasks')
                .insert({
                  ...nextInstance,
                  user_id: task.user_id,
                })
                .select()
                .single();

              if (!insertError && data) {
                updatedTasks.push(data);
              }
            } else {
              console.log('[v0] Skipping duplicate recurring instance for', nextInstance.start_date);
            }
          }
        }
        
        // Only re-run scheduling if auto-scheduling is not skipped
        if (!skipAutoSchedule) {
          // Re-run scheduling to backfill the freed capacity
          console.log('[v0] Task completed - re-optimizing schedule');
          const dailyMaxTasks = profile.daily_max_tasks && 
            typeof profile.daily_max_tasks === 'object' &&
            'weekday' in profile.daily_max_tasks &&
            'weekend' in profile.daily_max_tasks &&
            typeof profile.daily_max_tasks.weekday === 'number' &&
            typeof profile.daily_max_tasks.weekend === 'number'
              ? profile.daily_max_tasks
              : { weekday: 4, weekend: 4 };
              
          const schedulingResult = assignStartDates(
            updatedTasks,
            profile.category_limits,
            profile.daily_max_hours,
            dailyMaxTasks
          );
          
          // Update tasks with new start_dates
          const tasksToUpdate = schedulingResult.rescheduledTasks
            .filter(({ newDate, task: t }) => newDate !== null && t.id !== taskId);
          
          if (tasksToUpdate.length > 0) {
            await Promise.all(
              tasksToUpdate.map(({ task: t }) =>
                supabase
                  .from('tasks')
                  .update({ start_date: t.start_date })
                  .eq('id', t.id)
              )
            );
            
            // Show notification
            toast({
              title: 'Schedule Optimized',
              description: `${tasksToUpdate.length} task${tasksToUpdate.length > 1 ? 's were' : ' was'} moved to fill available time.`,
            });
          }
          
          setTasks(schedulingResult.tasks);
        } else {
          console.log('[v0] Task completed - skipping auto-scheduling per user preference');
          setTasks(updatedTasks);
        }
      } else {
        // Task was unchecked - recalculate streak
        await fetch('/api/streak', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'recalculate' })
        });
        setTasks(updatedTasks);
      }

      router.refresh();
    } catch (error) {
      console.error('[v0] Error updating task:', error);
      setTasks(tasks);
    }
  };

  const handleTaskEdit = (task: Task) => {
    console.log('[v0] Editing task:', task.title);
    setEditingTask(task);
    setShowEditDialog(true);
  };

  const handleTaskUpdated = async (updatedTask: Task) => {
    console.log('[v0] Task updated:', updatedTask.title);
    console.log('[v0] Updated values:', { due_date: updatedTask.due_date, start_date: updatedTask.start_date });
    
    // Update task in list
    const updatedTaskList = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    
    // Run full scheduling
    console.log('[v0] Re-running scheduling algorithm after edit...');
    const dailyMaxTasks = profile.daily_max_tasks && 
      typeof profile.daily_max_tasks === 'object' &&
      'weekday' in profile.daily_max_tasks &&
      'weekend' in profile.daily_max_tasks &&
      typeof profile.daily_max_tasks.weekday === 'number' &&
      typeof profile.daily_max_tasks.weekend === 'number'
        ? profile.daily_max_tasks
        : { weekday: 4, weekend: 4 };
        
    const schedulingResult = assignStartDates(
      updatedTaskList,
      profile.category_limits,
      profile.daily_max_hours,
      dailyMaxTasks
    );
    
    // Find tasks that need database updates (excluding the edited task itself)
    const tasksToUpdate = schedulingResult.rescheduledTasks
      .filter(({ newDate, task }) => newDate !== null && task.id !== updatedTask.id);
    
    // Batch update in database
    if (tasksToUpdate.length > 0) {
      console.log('[v0] Rescheduling', tasksToUpdate.length, 'additional tasks');
      
      try {
        await Promise.all(
          tasksToUpdate.map(({ task }) =>
            supabase
              .from('tasks')
              .update({ start_date: task.start_date })
              .eq('id', task.id)
          )
        );
        
        toast({
          title: 'Tasks Rescheduled',
          description: `${tasksToUpdate.length} task${tasksToUpdate.length > 1 ? 's were' : ' was'} moved to accommodate your changes.`,
        });
      } catch (error) {
        console.error('[v0] Error updating rescheduled tasks:', error);
        toast({
          title: 'Update Error',
          description: 'Some tasks may not have been rescheduled. Please refresh the page.',
          variant: 'destructive',
        });
      }
    }
    
    // Update state
    setTasks(schedulingResult.tasks);
    
    // Show warnings
    if (schedulingResult.warnings.length > 0) {
      toast({
        title: 'Scheduling Warning',
        description: schedulingResult.warnings[0],
        variant: 'destructive',
      });
    }
    
    // Show success
    toast({
      title: 'Task Updated',
      description: 'Your changes have been saved.',
    });
    
    // Refresh
    router.refresh();
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const deletedTask = tasks.find(t => t.id === taskId);
    const updatedTasks = tasks.filter(t => t.id !== taskId);

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      // Re-run scheduling to backfill freed capacity
      console.log('[v0] Task deleted - re-optimizing schedule');
      const dailyMaxTasks = profile.daily_max_tasks && 
        typeof profile.daily_max_tasks === 'object' &&
        'weekday' in profile.daily_max_tasks &&
        'weekend' in profile.daily_max_tasks &&
        typeof profile.daily_max_tasks.weekday === 'number' &&
        typeof profile.daily_max_tasks.weekend === 'number'
          ? profile.daily_max_tasks
          : { weekday: 4, weekend: 4 };
          
      const schedulingResult = assignStartDates(
        updatedTasks,
        profile.category_limits,
        profile.daily_max_hours,
        dailyMaxTasks
      );
      
      // Update tasks with new start_dates
      const tasksToUpdate = schedulingResult.rescheduledTasks
        .filter(({ newDate }) => newDate !== null);
      
      if (tasksToUpdate.length > 0) {
        await Promise.all(
          tasksToUpdate.map(({ task }) =>
            supabase
              .from('tasks')
              .update({ start_date: task.start_date })
              .eq('id', task.id)
          )
        );
        
        toast({
          title: 'Schedule Optimized',
          description: `${tasksToUpdate.length} task${tasksToUpdate.length > 1 ? 's were' : ' was'} rescheduled.`,
        });
      }
      
      setTasks(schedulingResult.tasks);
      router.refresh();
    } catch (error) {
      console.error('[v0] Error deleting task:', error);
      toast({
        title: 'Delete Failed',
        description: 'Could not delete task. Please try again.',
        variant: 'destructive',
      });
      router.refresh();
    }
  };

  const handlePullTaskToToday = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const todayStr = getTodayLocal();
    
    try {
      // Update task's start_date and pinned_date to today
      // pinned_date prevents the scheduling algorithm from moving this task
      // (only respected for the current day - resets on new day)
      const { error } = await supabase
        .from('tasks')
        .update({ start_date: todayStr, pinned_date: todayStr })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state (use functional update to get latest state)
      setTasks(currentTasks => 
        currentTasks.map(t => 
          t.id === taskId ? { ...t, start_date: todayStr, pinned_date: todayStr } : t
        )
      );

      toast({
        title: 'Task Added',
        description: `"${task.title}" has been added to today's focus!`,
      });

      router.refresh();
    } catch (error) {
      console.error('[v0] Error pulling task to today:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not add task to today. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader tasks={tasks} profile={profile} userEmail={userEmail} />
      
      <main className="flex-1 overflow-y-auto pb-safe-nav">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          {currentView === 'today' ? (
            <TodayView
              tasks={tasks}
              profile={profile}
              onTaskComplete={handleTaskComplete}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onPullTaskToToday={handlePullTaskToToday}
              onOpenAddDialog={() => setShowAddDialog(true)}
            />
          ) : (
            <ScheduleView
              tasks={tasks}
              onTaskComplete={handleTaskComplete}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
            />
          )}
        </div>
      </main>

      <BottomNav
        currentView={currentView}
        onViewChange={setCurrentView}
        onAddTask={() => setShowAddDialog(true)}
      />

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="dialog-sheet max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <AddTaskForm
            onTaskAdded={handleTaskAdded}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <EditTaskDialog
        task={editingTask}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
}

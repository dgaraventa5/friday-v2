'use client';

import { useState, useEffect, useRef } from 'react';
import { Task, Profile, Reminder, ReminderCompletion, ReminderWithStatus } from '@/lib/types';
import { TodayView } from '@/components/today/today-view';
import { ScheduleView } from '@/components/schedule/schedule-view';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { AppHeader } from '@/components/dashboard/app-header';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddTaskForm } from '@/components/task/add-task-form';
import { EditTaskDialog } from '@/components/task/edit-task-dialog';
import { AddReminderModal } from '@/components/reminders/add-reminder-modal';
import { EditReminderModal } from '@/components/reminders/edit-reminder-modal';
import { createBrowserClient } from '@/lib/supabase/client';
import { assignStartDates } from '@/lib/utils/task-prioritization';
import { generateNextRecurringInstance } from '@/lib/utils/recurring-tasks';
import { getTodaysReminders } from '@/lib/utils/reminder-utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getTodayLocal } from '@/lib/utils/date-utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DashboardClientProps {
  initialTasks: Task[];
  initialReminders: Reminder[];
  initialReminderCompletions: ReminderCompletion[];
  profile: Profile;
  userEmail?: string;
}

type NavView = 'today' | 'schedule';

export function DashboardClient({ 
  initialTasks, 
  initialReminders, 
  initialReminderCompletions, 
  profile, 
  userEmail 
}: DashboardClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [reminderCompletions, setReminderCompletions] = useState<ReminderCompletion[]>(initialReminderCompletions);
  const [currentView, setCurrentView] = useState<NavView>('today');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddReminderDialog, setShowAddReminderDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEditReminderDialog, setShowEditReminderDialog] = useState(false);
  
  // Queue for sequential processing of pulled tasks to avoid race conditions
  const [pullQueue, setPullQueue] = useState<string[]>([]);
  const isProcessingQueue = useRef(false);
  
  const router = useRouter();
  const { toast } = useToast();

  // Compute today's reminders with status
  const todaysReminders: ReminderWithStatus[] = getTodaysReminders(reminders, reminderCompletions);

  const supabase = createBrowserClient();

  // Helper to get daily max tasks configuration safely
  const getDailyMaxTasks = () => {
    return profile.daily_max_tasks && 
      typeof profile.daily_max_tasks === 'object' &&
      'weekday' in profile.daily_max_tasks &&
      'weekend' in profile.daily_max_tasks &&
      typeof profile.daily_max_tasks.weekday === 'number' &&
      typeof profile.daily_max_tasks.weekend === 'number'
        ? profile.daily_max_tasks
        : { weekday: 4, weekend: 4 };
  };

  // Process the pull queue sequentially
  useEffect(() => {
    const processQueue = async () => {
      if (pullQueue.length === 0) return;
      if (isProcessingQueue.current) return;

      isProcessingQueue.current = true;
      const taskId = pullQueue[0];
      const todayStr = getTodayLocal();

      try {
        // 1. Find the task in the CURRENT state
        // Note: tasks dependency ensures we have the latest state here
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
          console.warn(`Task ${taskId} not found in current state, skipping`);
          setPullQueue(prev => prev.slice(1));
          isProcessingQueue.current = false;
          return;
        }

        // 2. Update task in Supabase first (optimistic UI will follow)
        const { error } = await supabase
          .from('tasks')
          .update({ start_date: todayStr, pinned_date: todayStr })
          .eq('id', taskId);

        if (error) throw error;

        // 3. Calculate new schedule based on latest state
        // Update local state first with the pinned task
        const updatedTasks = tasks.map(t => 
          t.id === taskId ? { ...t, start_date: todayStr, pinned_date: todayStr } : t
        );

        console.log('[v0] Task pulled to today - optimizing schedule to fill gaps');
        const dailyMaxTasks = getDailyMaxTasks();
            
        const schedulingResult = assignStartDates(
          updatedTasks,
          profile.category_limits,
          profile.daily_max_hours,
          dailyMaxTasks
        );
        
        // 4. Find tasks that need database updates (excluding the pinned task itself)
        const tasksToUpdate = schedulingResult.rescheduledTasks
          .filter(({ newDate, task: t }) => newDate !== null && t.id !== taskId);
        
        if (tasksToUpdate.length > 0) {
          console.log('[v0] Rescheduling', tasksToUpdate.length, 'additional tasks to fill gaps');
          
          await Promise.all(
            tasksToUpdate.map(({ task: t }) =>
              supabase
                .from('tasks')
                .update({ start_date: t.start_date })
                .eq('id', t.id)
            )
          );
          
          toast({
            title: 'Schedule Optimized',
            description: `${tasksToUpdate.length} task${tasksToUpdate.length > 1 ? 's were' : ' was'} moved to fill available time.`,
          });
        }

        // 5. Update state with the full scheduled result
        setTasks(schedulingResult.tasks);

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
      } finally {
        // 6. Remove from queue and allow next processing
        setPullQueue(prev => prev.slice(1));
        isProcessingQueue.current = false;
      }
    };

    processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pullQueue, tasks]); // Depend on tasks to ensure we always use latest state

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
      
      const dailyMaxTasks = getDailyMaxTasks();
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
    const dailyMaxTasks = getDailyMaxTasks();
        
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
          const dailyMaxTasks = getDailyMaxTasks();
              
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
    const dailyMaxTasks = getDailyMaxTasks();
        
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
      const dailyMaxTasks = getDailyMaxTasks();
          
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

  // Simply add to queue - processing happens in useEffect
  const handlePullTaskToToday = async (taskId: string) => {
    setPullQueue(prev => [...prev, taskId]);
  };

  // Reminder handlers
  const handleReminderAdd = async (reminderData: Partial<Reminder>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reminders')
        .insert({
          ...reminderData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setReminders(prev => [data, ...prev]);
        toast({
          title: 'Reminder Added',
          description: `"${data.title}" has been created.`,
        });
      }

      setShowAddReminderDialog(false);
      router.refresh();
    } catch (error) {
      console.error('[v0] Error adding reminder:', error);
      toast({
        title: 'Error',
        description: 'Could not add reminder. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleReminderComplete = async (reminderId: string) => {
    const todayStr = getTodayLocal();
    const existingCompletion = reminderCompletions.find(
      c => c.reminder_id === reminderId && c.completion_date === todayStr
    );

    try {
      if (existingCompletion && existingCompletion.status === 'completed') {
        // Undo completion - delete the completion record
        const { error } = await supabase
          .from('reminder_completions')
          .delete()
          .eq('id', existingCompletion.id);

        if (error) throw error;

        setReminderCompletions(prev => prev.filter(c => c.id !== existingCompletion.id));
        
        // Decrement current_count for the reminder (reverse the increment from completion)
        const reminder = reminders.find(r => r.id === reminderId);
        if (reminder && reminder.current_count > 0) {
          await supabase
            .from('reminders')
            .update({ current_count: reminder.current_count - 1 })
            .eq('id', reminderId);

          setReminders(prev => 
            prev.map(r => r.id === reminderId ? { ...r, current_count: r.current_count - 1 } : r)
          );
        }
        
        // Recalculate streak
        await fetch('/api/streak', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'recalculate' })
        });
      } else {
        // Complete the reminder
        if (existingCompletion) {
          // Update existing (was skipped, now completing)
          const completedAt = new Date().toISOString();
          const { error } = await supabase
            .from('reminder_completions')
            .update({ status: 'completed', completed_at: completedAt })
            .eq('id', existingCompletion.id);

          if (error) throw error;

          setReminderCompletions(prev => 
            prev.map(c => c.id === existingCompletion.id ? { ...c, status: 'completed' as const, completed_at: completedAt } : c)
          );
        } else {
          // Insert new completion (using upsert to handle race conditions)
          const { data, error } = await supabase
            .from('reminder_completions')
            .upsert(
              {
                reminder_id: reminderId,
                completion_date: todayStr,
                status: 'completed',
                completed_at: new Date().toISOString(),
              },
              { onConflict: 'reminder_id,completion_date' }
            )
            .select()
            .single();

          if (error) throw error;

          if (data) {
            // Update state: add if new, or update if already exists
            setReminderCompletions(prev => {
              const existingIndex = prev.findIndex(c => c.id === data.id);
              if (existingIndex >= 0) {
                // Update existing
                return prev.map(c => c.id === data.id ? data : c);
              }
              // Add new
              return [...prev, data];
            });
          }
        }

        // Update streak
        await fetch('/api/streak', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update' })
        });

        // Increment current_count for the reminder
        const reminder = reminders.find(r => r.id === reminderId);
        if (reminder) {
          await supabase
            .from('reminders')
            .update({ current_count: reminder.current_count + 1 })
            .eq('id', reminderId);

          setReminders(prev => 
            prev.map(r => r.id === reminderId ? { ...r, current_count: r.current_count + 1 } : r)
          );
        }
      }

      router.refresh();
    } catch (error) {
      console.error('[v0] Error completing reminder:', error);
      toast({
        title: 'Error',
        description: 'Could not update reminder. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReminderSkip = async (reminderId: string) => {
    const todayStr = getTodayLocal();

    try {
      const { data, error } = await supabase
        .from('reminder_completions')
        .insert({
          reminder_id: reminderId,
          completion_date: todayStr,
          status: 'skipped',
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setReminderCompletions(prev => [...prev, data]);
        toast({
          title: 'Reminder Skipped',
          description: 'This reminder has been skipped for today.',
        });
      }

      router.refresh();
    } catch (error) {
      console.error('[v0] Error skipping reminder:', error);
      toast({
        title: 'Error',
        description: 'Could not skip reminder. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReminderUndoSkip = async (reminderId: string) => {
    const todayStr = getTodayLocal();
    const existingCompletion = reminderCompletions.find(
      c => c.reminder_id === reminderId && c.completion_date === todayStr && c.status === 'skipped'
    );

    if (!existingCompletion) return;

    try {
      const { error } = await supabase
        .from('reminder_completions')
        .delete()
        .eq('id', existingCompletion.id);

      if (error) throw error;

      setReminderCompletions(prev => prev.filter(c => c.id !== existingCompletion.id));
      toast({
        title: 'Skip Undone',
        description: 'This reminder is back on your list.',
      });

      router.refresh();
    } catch (error) {
      console.error('[v0] Error undoing skip:', error);
      toast({
        title: 'Error',
        description: 'Could not undo skip. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReminderEdit = (reminder: ReminderWithStatus) => {
    setEditingReminder(reminder);
    setShowEditReminderDialog(true);
  };

  const handleReminderUpdate = async (updatedReminder: Reminder) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({
          title: updatedReminder.title,
          time_label: updatedReminder.time_label,
          recurrence_type: updatedReminder.recurrence_type,
          recurrence_interval: updatedReminder.recurrence_interval,
          recurrence_days: updatedReminder.recurrence_days,
          monthly_type: updatedReminder.monthly_type,
          monthly_week_position: updatedReminder.monthly_week_position,
          end_type: updatedReminder.end_type,
          end_count: updatedReminder.end_count,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedReminder.id);

      if (error) throw error;

      setReminders(prev => 
        prev.map(r => r.id === updatedReminder.id ? updatedReminder : r)
      );

      toast({
        title: 'Reminder Updated',
        description: 'Your changes have been saved.',
      });

      setShowEditReminderDialog(false);
      router.refresh();
    } catch (error) {
      console.error('[v0] Error updating reminder:', error);
      toast({
        title: 'Error',
        description: 'Could not update reminder. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReminderDelete = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId);

      if (error) throw error;

      setReminders(prev => prev.filter(r => r.id !== reminderId));
      setReminderCompletions(prev => prev.filter(c => c.reminder_id !== reminderId));

      toast({
        title: 'Reminder Deleted',
        description: 'The reminder has been removed.',
      });

      router.refresh();
    } catch (error) {
      console.error('[v0] Error deleting reminder:', error);
      toast({
        title: 'Error',
        description: 'Could not delete reminder. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-background overflow-hidden">
      <AppHeader tasks={tasks} profile={profile} userEmail={userEmail} />
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          {currentView === 'today' ? (
            <TodayView
              tasks={tasks}
              profile={profile}
              reminders={todaysReminders}
              onTaskComplete={handleTaskComplete}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onPullTaskToToday={handlePullTaskToToday}
              onOpenAddDialog={() => setShowAddDialog(true)}
              onReminderComplete={handleReminderComplete}
              onReminderSkip={handleReminderSkip}
              onReminderUndoSkip={handleReminderUndoSkip}
              onReminderEdit={handleReminderEdit}
              onReminderDelete={handleReminderDelete}
              onOpenAddReminderDialog={() => setShowAddReminderDialog(true)}
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

      <AddReminderModal
        open={showAddReminderDialog}
        onOpenChange={setShowAddReminderDialog}
        onSave={handleReminderAdd}
      />

      <EditReminderModal
        reminder={editingReminder}
        open={showEditReminderDialog}
        onOpenChange={setShowEditReminderDialog}
        onSave={handleReminderUpdate}
      />
      
    </div>
  );
}

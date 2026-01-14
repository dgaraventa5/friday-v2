import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Task, Profile, CategoryLimits, DailyMaxHours, DailyMaxTasks } from '@/lib/types';
import { TasksService } from '@/lib/services';
import { assignStartDates } from '@/lib/utils/task-prioritization';
import { generateNextRecurringInstance } from '@/lib/utils/recurring-tasks';
import { getTodayLocal } from '@/lib/utils/date-utils';

interface UseTasksOptions {
  initialTasks: Task[];
  tasksService: TasksService;
  profile: Profile;
  toast: (options: {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }) => void;
}

interface UseTasksReturn {
  tasks: Task[];
  addTask: (newTasks: Task | Task[]) => Promise<void>;
  updateTask: (updatedTask: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleComplete: (taskId: string, skipAutoSchedule?: boolean) => Promise<void>;
  pullToToday: (taskId: string) => void;
  editTask: (task: Task) => void;
  isPulling: boolean;
  // For dashboard to manage dialog state
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  showEditDialog: boolean;
  setShowEditDialog: (show: boolean) => void;
}

export function useTasks({
  initialTasks,
  tasksService,
  profile,
  toast,
}: UseTasksOptions): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [pullQueue, setPullQueue] = useState<string[]>([]);
  const isProcessingQueue = useRef(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const router = useRouter();

  // Helper to get daily max tasks configuration safely
  const getDailyMaxTasks = (): DailyMaxTasks => {
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
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
          console.warn(`Task ${taskId} not found in current state, skipping`);
          setPullQueue(prev => prev.slice(1));
          isProcessingQueue.current = false;
          return;
        }

        // 2. Update task in database first (optimistic UI will follow)
        const result = await tasksService.updateTask(taskId, {
          start_date: todayStr,
          pinned_date: todayStr
        });

        if (result.error) throw result.error;

        // 3. Calculate new schedule based on latest state
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

          const updates = tasksToUpdate.map(({ task: t }) => ({
            id: t.id,
            data: { start_date: t.start_date }
          }));
          await tasksService.updateTasks(updates);

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

  // Initial scheduling on mount
  useEffect(() => {
    const runInitialScheduling = async () => {
      console.log('[v0] Running initial scheduling for all tasks');
      console.log('[v0] Profile data:', {
        category_limits: profile.category_limits,
        daily_max_hours: profile.daily_max_hours,
        daily_max_tasks: profile.daily_max_tasks,
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

        const updates = tasksToUpdate.map(({ task }) => ({
          id: task.id,
          data: { start_date: task.start_date }
        }));
        await tasksService.updateTasks(updates);
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
  }, []); // Only run on mount

  const addTask = async (newTasks: Task | Task[]) => {
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

      const updates = tasksToUpdate.map(({ task }) => ({
        id: task.id,
        data: { start_date: task.start_date }
      }));
      await tasksService.updateTasks(updates);

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

  const toggleComplete = async (taskId: string, skipAutoSchedule: boolean = false) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompletedState = !task.completed;
    const todayStr = getTodayLocal();

    // If completing a task scheduled for the future, move it to today
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
      const result = await tasksService.updateTask(taskId, {
        completed: newCompletedState,
        completed_at: newCompletedState ? new Date().toISOString() : null,
        ...(shouldMoveToToday && { start_date: todayStr })
      });

      if (result.error) throw result.error;

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
              const insertResult = await tasksService.createTask({
                ...nextInstance,
                user_id: task.user_id,
              });

              if (!insertResult.error && insertResult.data) {
                updatedTasks.push(insertResult.data);
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
            const updates = tasksToUpdate.map(({ task: t }) => ({
              id: t.id,
              data: { start_date: t.start_date }
            }));
            await tasksService.updateTasks(updates);

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

  const editTask = (task: Task) => {
    console.log('[v0] Editing task:', task.title);
    setEditingTask(task);
    setShowEditDialog(true);
  };

  const updateTask = async (updatedTask: Task) => {
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
        const updates = tasksToUpdate.map(({ task }) => ({
          id: task.id,
          data: { start_date: task.start_date }
        }));
        await tasksService.updateTasks(updates);

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

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const deletedTask = tasks.find(t => t.id === taskId);
    const updatedTasks = tasks.filter(t => t.id !== taskId);

    try {
      const result = await tasksService.deleteTask(taskId);

      if (result.error) throw result.error;

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
        const updates = tasksToUpdate.map(({ task }) => ({
          id: task.id,
          data: { start_date: task.start_date }
        }));
        await tasksService.updateTasks(updates);

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

  const pullToToday = (taskId: string) => {
    setPullQueue(prev => [...prev, taskId]);
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    pullToToday,
    editTask,
    isPulling: pullQueue.length > 0,
    editingTask,
    setEditingTask,
    showEditDialog,
    setShowEditDialog,
  };
}

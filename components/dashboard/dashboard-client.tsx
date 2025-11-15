'use client';

import { useState, useEffect } from 'react';
import { Task, Profile } from '@/lib/types';
import { TodayView } from '@/components/today/today-view';
import { ScheduleView } from '@/components/schedule/schedule-view';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddTaskForm } from '@/components/task/add-task-form';
import { EditTaskDialog } from '@/components/task/edit-task-dialog';
import { createBrowserClient } from '@/lib/supabase/client';
import { assignStartDates } from '@/lib/utils/task-prioritization';
import { generateNextRecurringInstance } from '@/lib/utils/recurring-tasks';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface DashboardClientProps {
  initialTasks: Task[];
  profile: Profile;
}

type NavView = 'today' | 'schedule';

export function DashboardClient({ initialTasks, profile }: DashboardClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [currentView, setCurrentView] = useState<NavView>('today');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const supabase = createBrowserClient();

  useEffect(() => {
    const scheduleUnscheduledTasks = async () => {
      const unscheduled = tasks.filter(t => !t.completed && !t.start_date);
      
      if (unscheduled.length > 0) {
        console.log('[v0] Found', unscheduled.length, 'unscheduled tasks');
        
        const scheduled = assignStartDates(
          tasks,
          profile.category_limits,
          profile.daily_max_hours
        );
        
        const updates = scheduled
          .filter(t => {
            const original = tasks.find(orig => orig.id === t.id);
            return original && !original.start_date && t.start_date;
          })
          .map(task => 
            supabase
              .from('tasks')
              .update({ start_date: task.start_date })
              .eq('id', task.id)
          );
        
        if (updates.length > 0) {
          console.log('[v0] Updating', updates.length, 'tasks with start dates');
          await Promise.all(updates);
          setTasks(scheduled);
        }
      }
    };
    
    scheduleUnscheduledTasks();
  }, []);

  const handleTaskAdded = async (newTasks: Task | Task[]) => {
    const tasksArray = Array.isArray(newTasks) ? newTasks : [newTasks];
    console.log('[v0] handleTaskAdded called with', tasksArray.length, 'tasks');
    
    setTasks(prevTasks => {
      const updated = [...prevTasks, ...tasksArray];
      console.log('[v0] Total tasks after adding:', updated.length);
      
      const scheduled = assignStartDates(
        updated,
        profile.category_limits,
        profile.daily_max_hours
      );
      
      console.log('[v0] Scheduled tasks:', scheduled.filter(t => t.start_date).length);
      
      tasksArray.forEach(async (addedTask) => {
        const scheduledVersion = scheduled.find(t => t.id === addedTask.id);
        if (scheduledVersion && scheduledVersion.start_date) {
          console.log('[v0] Updating task', addedTask.title, 'with start_date:', scheduledVersion.start_date);
          await supabase
            .from('tasks')
            .update({ start_date: scheduledVersion.start_date })
            .eq('id', addedTask.id);
        }
      });
      
      return scheduled;
    });
    
    setShowAddDialog(false);
    
    setTimeout(() => {
      router.refresh();
    }, 500);
  };

  const handleTaskComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompletedState = !task.completed;

    setTasks(tasks.map(t => 
      t.id === taskId 
        ? { ...t, completed: newCompletedState, completed_at: newCompletedState ? new Date().toISOString() : null }
        : t
    ));

    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          completed: newCompletedState,
          completed_at: newCompletedState ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      if (newCompletedState) {
        await fetch('/api/streak', { method: 'POST' });
        
        if (task.is_recurring) {
          const nextInstance = generateNextRecurringInstance(task);
          if (nextInstance) {
            const { data, error: insertError } = await supabase
              .from('tasks')
              .insert({
                ...nextInstance,
                user_id: task.user_id,
              })
              .select()
              .single();

            if (!insertError && data) {
              setTasks([...tasks, data]);
            }
          }
        }
      }

      router.refresh();
    } catch (error) {
      console.error('[v0] Error updating task:', error);
      setTasks(tasks.map(t => 
        t.id === taskId ? task : t
      ));
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
    
    // Optimistically update local state first for immediate UI feedback
    setTasks(prevTasks => prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    
    // Re-run scheduling algorithm for all tasks
    const updatedTaskList = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    
    console.log('[v0] Re-running scheduling algorithm...');
    const scheduled = assignStartDates(
      updatedTaskList,
      profile.category_limits,
      profile.daily_max_hours
    );
    
    // Find tasks whose start_date changed due to rescheduling
    const tasksToUpdate = scheduled.filter(t => {
      const original = updatedTaskList.find(orig => orig.id === t.id);
      return original && original.start_date !== t.start_date && t.id !== updatedTask.id;
    });
    
    // Batch update changed start_dates in database
    if (tasksToUpdate.length > 0) {
      console.log('[v0] Rescheduling', tasksToUpdate.length, 'additional tasks');
      try {
        await Promise.all(
          tasksToUpdate.map(task =>
            supabase
              .from('tasks')
              .update({ start_date: task.start_date })
              .eq('id', task.id)
          )
        );
      } catch (error) {
        console.error('[v0] Error updating rescheduled tasks:', error);
      }
    }
    
    // Update state with all scheduled tasks
    setTasks(scheduled);
    
    // Refresh to sync with server
    router.refresh();
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setTasks(tasks.filter(t => t.id !== taskId));

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error('[v0] Error deleting task:', error);
      router.refresh();
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden">
        {currentView === 'today' ? (
          <TodayView
            tasks={tasks}
            profile={profile}
            onTaskComplete={handleTaskComplete}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
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

      <BottomNav
        currentView={currentView}
        onViewChange={setCurrentView}
        onAddTask={() => setShowAddDialog(true)}
      />

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

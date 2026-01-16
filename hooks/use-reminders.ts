import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Reminder, ReminderCompletion, ReminderWithStatus } from '@/lib/types';
import { RemindersService } from '@/lib/services/reminders-service';
import { getTodaysReminders } from '@/lib/utils/reminder-utils';
import { getTodayLocal } from '@/lib/utils/date-utils';
import { createBrowserClient } from '@/lib/supabase/client';

interface UseRemindersParams {
  initialReminders: Reminder[];
  initialReminderCompletions: ReminderCompletion[];
  remindersService: RemindersService;
  toast: (options: {
    title: string;
    description: string;
    variant?: 'default' | 'destructive';
  }) => void;
}

interface UseRemindersReturn {
  reminders: Reminder[];
  reminderCompletions: ReminderCompletion[];
  todaysReminders: ReminderWithStatus[];
  addReminder: (reminderData: Partial<Reminder>) => Promise<void>;
  completeReminder: (reminderId: string) => Promise<void>;
  skipReminder: (reminderId: string) => Promise<void>;
  undoSkipReminder: (reminderId: string) => Promise<void>;
  editReminder: (reminder: ReminderWithStatus) => void;
  updateReminder: (updatedReminder: Reminder) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;
  editingReminder: Reminder | null;
  setEditingReminder: (reminder: Reminder | null) => void;
  showEditReminderDialog: boolean;
  setShowEditReminderDialog: (show: boolean) => void;
}

export function useReminders({
  initialReminders,
  initialReminderCompletions,
  remindersService,
  toast,
}: UseRemindersParams): UseRemindersReturn {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [reminderCompletions, setReminderCompletions] = useState<ReminderCompletion[]>(initialReminderCompletions);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [showEditReminderDialog, setShowEditReminderDialog] = useState(false);

  const router = useRouter();
  const supabase = createBrowserClient();

  // Compute today's reminders with status
  const todaysReminders: ReminderWithStatus[] = getTodaysReminders(reminders, reminderCompletions);

  const addReminder = async (reminderData: Partial<Reminder>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const result = await remindersService.createReminder({
        ...reminderData,
        user_id: user.id,
      });

      if (result.error) throw result.error;

      if (result.data) {
        const data = result.data;
        setReminders(prev => [data, ...prev]);
        toast({
          title: 'Reminder Added',
          description: `"${data.title}" has been created.`,
        });
      }

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

  const completeReminder = async (reminderId: string) => {
    // Verify authentication first to ensure RLS policies work
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Session Expired',
        description: 'Please refresh the page to continue.',
        variant: 'destructive',
      });
      return;
    }

    const todayStr = getTodayLocal();
    const existingCompletion = reminderCompletions.find(
      c => c.reminder_id === reminderId && c.completion_date === todayStr
    );

    try {
      if (existingCompletion && existingCompletion.status === 'completed') {
        // Undo completion - delete the completion record
        const deleteResult = await remindersService.deleteCompletion(existingCompletion.id);

        if (deleteResult.error) throw deleteResult.error;

        setReminderCompletions(prev => prev.filter(c => c.id !== existingCompletion.id));

        // Decrement current_count for the reminder (reverse the increment from completion)
        const reminder = reminders.find(r => r.id === reminderId);
        if (reminder && reminder.current_count > 0) {
          await remindersService.updateReminder(reminderId, {
            current_count: reminder.current_count - 1
          });

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
          const updateResult = await remindersService.upsertCompletion({
            id: existingCompletion.id,
            reminder_id: reminderId,
            completion_date: todayStr,
            status: 'completed',
            completed_at: completedAt
          });

          if (updateResult.error) throw updateResult.error;
          if (!updateResult.data) {
            throw new Error('Failed to update completion - no data returned');
          }

          setReminderCompletions(prev =>
            prev.map(c => c.id === existingCompletion.id ? { ...c, status: 'completed' as const, completed_at: completedAt } : c)
          );
        } else {
          // Insert new completion (using upsert to handle race conditions)
          const upsertResult = await remindersService.upsertCompletion({
            reminder_id: reminderId,
            completion_date: todayStr,
            status: 'completed',
            completed_at: new Date().toISOString(),
          });

          if (upsertResult.error) throw upsertResult.error;
          if (!upsertResult.data) {
            throw new Error('Failed to save completion - no data returned');
          }

          const data = upsertResult.data;
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

        // Update streak
        await fetch('/api/streak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update' })
        });

        // Increment current_count for the reminder
        const reminder = reminders.find(r => r.id === reminderId);
        if (reminder) {
          await remindersService.updateReminder(reminderId, {
            current_count: reminder.current_count + 1
          });

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

  const skipReminder = async (reminderId: string) => {
    // Verify authentication first to ensure RLS policies work
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Session Expired',
        description: 'Please refresh the page to continue.',
        variant: 'destructive',
      });
      return;
    }

    const todayStr = getTodayLocal();

    try {
      const result = await remindersService.upsertCompletion({
        reminder_id: reminderId,
        completion_date: todayStr,
        status: 'skipped',
      });

      if (result.error) throw result.error;
      if (!result.data) {
        throw new Error('Failed to skip reminder - no data returned');
      }

      const data = result.data;
      setReminderCompletions(prev => [...prev, data]);
      toast({
        title: 'Reminder Skipped',
        description: 'This reminder has been skipped for today.',
      });

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

  const undoSkipReminder = async (reminderId: string) => {
    // Verify authentication first to ensure RLS policies work
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Session Expired',
        description: 'Please refresh the page to continue.',
        variant: 'destructive',
      });
      return;
    }

    const todayStr = getTodayLocal();
    const existingCompletion = reminderCompletions.find(
      c => c.reminder_id === reminderId && c.completion_date === todayStr && c.status === 'skipped'
    );

    if (!existingCompletion) return;

    try {
      const result = await remindersService.deleteCompletion(existingCompletion.id);

      if (result.error) throw result.error;

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

  const editReminder = (reminder: ReminderWithStatus) => {
    setEditingReminder(reminder);
    setShowEditReminderDialog(true);
  };

  const updateReminder = async (updatedReminder: Reminder) => {
    try {
      const result = await remindersService.updateReminder(updatedReminder.id, {
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
      });

      if (result.error) throw result.error;

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

  const deleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      const result = await remindersService.deleteReminder(reminderId);

      if (result.error) throw result.error;

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

  return {
    reminders,
    reminderCompletions,
    todaysReminders,
    addReminder,
    completeReminder,
    skipReminder,
    undoSkipReminder,
    editReminder,
    updateReminder,
    deleteReminder,
    editingReminder,
    setEditingReminder,
    showEditReminderDialog,
    setShowEditReminderDialog,
  };
}

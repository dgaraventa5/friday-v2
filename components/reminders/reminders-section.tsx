'use client';

import { ReminderWithStatus } from '@/lib/types';
import { ReminderCard } from './reminder-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface RemindersSectionProps {
  reminders: ReminderWithStatus[];
  onComplete: (reminderId: string) => void;
  onSkip: (reminderId: string) => void;
  onUndoSkip: (reminderId: string) => void;
  onEdit: (reminder: ReminderWithStatus) => void;
  onDelete: (reminderId: string) => void;
  onAddNew: () => void;
}

export function RemindersSection({
  reminders,
  onComplete,
  onSkip,
  onUndoSkip,
  onEdit,
  onDelete,
  onAddNew,
}: RemindersSectionProps) {
  const incompleteReminders = reminders.filter(r => r.todayStatus === 'incomplete');
  const completedReminders = reminders.filter(r => r.todayStatus === 'completed');
  const skippedReminders = reminders.filter(r => r.todayStatus === 'skipped');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Reminders
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddNew}
          className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-2">
        {reminders.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No reminders for today</p>
            <Button
              variant="link"
              size="sm"
              onClick={onAddNew}
              className="mt-1 text-xs"
            >
              Add a reminder
            </Button>
          </div>
        ) : (
          <>
            {/* Incomplete reminders */}
            {incompleteReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onComplete={onComplete}
                onSkip={onSkip}
                onUndoSkip={onUndoSkip}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}

            {/* Completed reminders */}
            {completedReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onComplete={onComplete}
                onSkip={onSkip}
                onUndoSkip={onUndoSkip}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}

            {/* Skipped reminders */}
            {skippedReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onComplete={onComplete}
                onSkip={onSkip}
                onUndoSkip={onUndoSkip}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/lib/types';
import { createBrowserClient } from '@/lib/supabase/client';
import { formatDateLocal, parseDateLocal } from '@/lib/utils/date-utils';
import { useToast } from '@/hooks/use-toast';
import { createTasksService } from '@/lib/services';
import { EisenhowerPicker } from '@/components/task/eisenhower-picker';

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDelete: (taskId: string) => Promise<void>;
}

export function EditTaskDialog({ task, open, onOpenChange, onTaskUpdated, onTaskDelete }: EditTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Work' | 'Home' | 'Health' | 'Personal'>('Personal');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [estimatedHours, setEstimatedHours] = useState('1');
  const [importance, setImportance] = useState<'important' | 'not-important'>('not-important');
  const [urgency, setUrgency] = useState<'urgent' | 'not-urgent'>('not-urgent');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const supabase = createBrowserClient();
  const tasksService = createTasksService(supabase);
  const { toast } = useToast();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setCategory(task.category);
      setDueDate(task.due_date ? parseDateLocal(task.due_date) : undefined);
      setEstimatedHours(task.estimated_hours.toString());
      setImportance(task.importance);
      setUrgency(task.urgency);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    setError('');

    if (!title.trim()) {
      setError('Task name is required');
      return;
    }

    if (!dueDate) {
      setError('Due date is required');
      return;
    }

    const hours = parseFloat(estimatedHours);
    if (isNaN(hours) || hours <= 0) {
      setError('Estimated hours must be a positive number');
      return;
    }

    setIsSubmitting(true);

    try {
      const dueDateStr = formatDateLocal(dueDate);

      const updateData: Partial<Task> & { updated_at: string } = {
        title: title.trim(),
        category,
        due_date: dueDateStr,
        estimated_hours: hours,
        importance,
        urgency,
        updated_at: new Date().toISOString(),
        // Clear pinned_date when task is edited so it can be rescheduled normally
        pinned_date: null,
      };
      
      if (!task.is_recurring) {
        updateData.start_date = dueDateStr;
      }
      
      const result = await tasksService.updateTask(task.id, updateData);

      if (result.error) throw result.error;
      if (!result.data) throw new Error('No task data returned');

      toast({
        title: 'Task updated',
        description: 'Your task has been saved successfully.',
      });

      onTaskUpdated(result.data);
      onOpenChange(false);
    } catch (err) {
      setError('Failed to update task. Please try again.');
      
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-sheet">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-2.5 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Task Name</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?…"
              className="text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={category} onValueChange={(value: string) => setCategory(value as typeof category)}>
                <SelectTrigger id="edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Work">Work</SelectItem>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {dueDate ? dueDate.toLocaleDateString() : 'Pick a date'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-hours">Est. Hours</Label>
              <Input
                id="edit-hours"
                type="number"
                step="0.5"
                min="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <EisenhowerPicker
                importance={importance}
                urgency={urgency}
                onChange={(imp, urg) => {
                  setImportance(imp);
                  setUrgency(urg);
                }}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-3 md:flex-row md:items-center md:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (!task) return;
                await onTaskDelete(task.id);
                onOpenChange(false);
              }}
              disabled={isSubmitting}
              className="w-full md:w-auto"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
            <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full md:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

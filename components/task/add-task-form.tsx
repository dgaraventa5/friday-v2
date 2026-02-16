'use client';

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { createBrowserClient } from '@/lib/supabase/client';
import { Task } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateInitialRecurringInstances } from '@/lib/utils/recurring-tasks';
import { formatDateLocal } from '@/lib/utils/date-utils';
import { createTasksService } from '@/lib/services/tasks-service';
import { EisenhowerPicker } from '@/components/task/eisenhower-picker';

interface AddTaskFormProps {
  onTaskAdded: (task: Task) => void;
  onCancel: () => void;
}

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export function AddTaskForm({ onTaskAdded, onCancel }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Work' | 'Home' | 'Health' | 'Personal'>('Personal');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [estimatedHours, setEstimatedHours] = useState('1');
  const [importance, setImportance] = useState<'important' | 'not-important'>('not-important');
  const [urgency, setUrgency] = useState<'urgent' | 'not-urgent'>('not-urgent');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [recurringEndType, setRecurringEndType] = useState<'never' | 'after'>('never');
  const [recurringEndCount, setRecurringEndCount] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const supabase = createBrowserClient();

  const handleDayToggle = (day: number) => {
    setRecurringDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    if (isRecurring && recurringInterval === 'weekly' && recurringDays.length === 0) {
      setError('Please select at least one day for weekly recurring tasks');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const recurringSeriesId = isRecurring ? crypto.randomUUID() : null;

      const dueDateStr = formatDateLocal(dueDate);

      console.log('[v0] Form submission - selected date:', dueDate.toISOString());
      console.log('[v0] Form submission - normalized date (local):', dueDateStr);
      console.log('[v0] Form submission - recurring days:', recurringDays);

      const baseTaskData = {
        user_id: user.id,
        title: title.trim(),
        category,
        due_date: dueDateStr,
        estimated_hours: hours,
        importance,
        urgency,
        is_recurring: isRecurring,
        recurring_series_id: recurringSeriesId,
        recurring_interval: isRecurring ? recurringInterval : null,
        recurring_days: isRecurring && recurringInterval === 'weekly' ? recurringDays : null,
        recurring_end_type: isRecurring ? recurringEndType : null,
        recurring_end_count: isRecurring && recurringEndType === 'after' ? parseInt(recurringEndCount) : null,
        recurring_current_count: 1,
        completed: false,
      };

      const instances = generateInitialRecurringInstances(baseTaskData, 4);

      console.log('[v0] Creating', instances.length, 'task instances');

      // Use TasksService instead of direct Supabase
      const tasksService = createTasksService(supabase);
      const result = await tasksService.createTasks(instances);

      if (result.error) throw result.error;

      if (result.data && result.data.length > 0) {
        result.data.forEach(task => onTaskAdded(task));
      }
    } catch (err) {
      console.error('[v0] Error adding task:', err);
      setError('Failed to add task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-2.5 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">Task Name</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?…"
          className="text-base"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={(value: any) => setCategory(value)}>
            <SelectTrigger id="category">
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
          <Label htmlFor="hours">Est. Hours</Label>
          <Input
            id="hours"
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

      <button
        type="button"
        onClick={() => setShowMoreOptions(!showMoreOptions)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md p-1 -m-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronDown className={cn('h-4 w-4 transition-transform', showMoreOptions && 'rotate-180')} aria-hidden="true" />
        More options
      </button>

      {showMoreOptions && (
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
            />
            <Label htmlFor="recurring" className="cursor-pointer mb-0">
              Make this a recurring task
            </Label>
          </div>

          {isRecurring && (
            <div className="space-y-3 pl-6">
              <div className="space-y-1.5">
                <Label htmlFor="interval">Repeat</Label>
                <Select value={recurringInterval} onValueChange={(value: any) => setRecurringInterval(value)}>
                  <SelectTrigger id="interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recurringInterval === 'weekly' && (
                <div className="space-y-1.5">
                  <Label>Repeat on</Label>
                  <div className="flex gap-1.5">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={recurringDays.includes(day.value) ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 px-0"
                        onClick={() => handleDayToggle(day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label>Ends</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="never"
                      name="recurring-end"
                      checked={recurringEndType === 'never'}
                      onChange={() => setRecurringEndType('never')}
                      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
                    />
                    <Label htmlFor="never" className="cursor-pointer">
                      Never
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="after"
                      name="recurring-end"
                      checked={recurringEndType === 'after'}
                      onChange={() => setRecurringEndType('after')}
                      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
                    />
                    <Label htmlFor="after" className="cursor-pointer">
                      After
                    </Label>
                    {recurringEndType === 'after' && (
                      <Input
                        type="number"
                        min="1"
                        value={recurringEndCount}
                        onChange={(e) => setRecurringEndCount(e.target.value)}
                        className="w-20"
                      />
                    )}
                    {recurringEndType === 'after' && (
                      <span className="text-sm text-muted-foreground">occurrences</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Adding...' : 'Add Task'}
        </Button>
      </div>
    </form>
  );
}

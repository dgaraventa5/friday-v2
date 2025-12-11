'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Reminder } from '@/lib/types';

interface AddReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (reminder: Partial<Reminder>) => void;
}

const DAYS_OF_WEEK = [
  { label: 'S', fullLabel: 'Sun', value: 0 },
  { label: 'M', fullLabel: 'Mon', value: 1 },
  { label: 'T', fullLabel: 'Tue', value: 2 },
  { label: 'W', fullLabel: 'Wed', value: 3 },
  { label: 'T', fullLabel: 'Thu', value: 4 },
  { label: 'F', fullLabel: 'Fri', value: 5 },
  { label: 'S', fullLabel: 'Sat', value: 6 },
];

export function AddReminderModal({ open, onOpenChange, onSave }: AddReminderModalProps) {
  const [title, setTitle] = useState('');
  const [timeLabel, setTimeLabel] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [recurrenceInterval, setRecurrenceInterval] = useState('1');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [monthlyType, setMonthlyType] = useState<'day_of_month' | 'nth_weekday'>('day_of_month');
  const [monthlyDayOfMonth, setMonthlyDayOfMonth] = useState('1');
  const [monthlyWeekPosition, setMonthlyWeekPosition] = useState('1');
  const [monthlyWeekday, setMonthlyWeekday] = useState('1');
  const [endType, setEndType] = useState<'never' | 'after'>('never');
  const [endCount, setEndCount] = useState('10');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const resetForm = () => {
    setTitle('');
    setTimeLabel('');
    setRecurrenceType('daily');
    setRecurrenceInterval('1');
    setSelectedDays([]);
    setMonthlyType('day_of_month');
    setMonthlyDayOfMonth('1');
    setMonthlyWeekPosition('1');
    setMonthlyWeekday('1');
    setEndType('never');
    setEndCount('10');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Reminder name is required');
      return;
    }

    if (recurrenceType === 'weekly' && selectedDays.length === 0) {
      setError('Please select at least one day for weekly reminders');
      return;
    }

    const interval = parseInt(recurrenceInterval, 10);
    if (isNaN(interval) || interval < 1) {
      setError('Interval must be at least 1');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build recurrence_days based on type
      let recurrenceDays: number[] | null = null;
      let monthlyTypeValue: 'day_of_month' | 'nth_weekday' | null = null;
      let monthlyWeekPositionValue: number | null = null;

      if (recurrenceType === 'weekly') {
        recurrenceDays = selectedDays;
      } else if (recurrenceType === 'monthly') {
        monthlyTypeValue = monthlyType;
        if (monthlyType === 'day_of_month') {
          recurrenceDays = [parseInt(monthlyDayOfMonth, 10)];
        } else {
          recurrenceDays = [parseInt(monthlyWeekday, 10)];
          monthlyWeekPositionValue = parseInt(monthlyWeekPosition, 10);
        }
      }

      // Format time label as HH:MM:SS if provided
      let formattedTimeLabel: string | null = null;
      if (timeLabel) {
        formattedTimeLabel = timeLabel.includes(':') ? timeLabel : `${timeLabel}:00`;
        if (formattedTimeLabel.split(':').length === 2) {
          formattedTimeLabel += ':00';
        }
      }

      const reminderData: Partial<Reminder> = {
        title: title.trim(),
        time_label: formattedTimeLabel,
        recurrence_type: recurrenceType,
        recurrence_interval: interval,
        recurrence_days: recurrenceDays,
        monthly_type: monthlyTypeValue,
        monthly_week_position: monthlyWeekPositionValue,
        end_type: endType,
        end_count: endType === 'after' ? parseInt(endCount, 10) : null,
        current_count: 0,
        is_active: true,
      };

      await onSave(reminderData);
      resetForm();
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving reminder:', err);
      setError('Failed to save reminder. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="dialog-sheet max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Reminder</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Reminder Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Take medication"
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time (optional)</Label>
            <Input
              id="time"
              type="time"
              value={timeLabel}
              onChange={(e) => setTimeLabel(e.target.value)}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              This is a display label only - no notifications will be sent.
            </p>
          </div>

          <div className="space-y-4">
            <Label>Repeat every</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                value={recurrenceInterval}
                onChange={(e) => setRecurrenceInterval(e.target.value)}
                className="w-20"
              />
              <Select
                value={recurrenceType}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => {
                  setRecurrenceType(value);
                  if (value !== 'weekly') {
                    setSelectedDays([]);
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">
                    {parseInt(recurrenceInterval) === 1 ? 'day' : 'days'}
                  </SelectItem>
                  <SelectItem value="weekly">
                    {parseInt(recurrenceInterval) === 1 ? 'week' : 'weeks'}
                  </SelectItem>
                  <SelectItem value="monthly">
                    {parseInt(recurrenceInterval) === 1 ? 'month' : 'months'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {recurrenceType === 'weekly' && (
            <div className="space-y-2">
              <Label>Repeat on</Label>
              <div className="flex gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                    size="sm"
                    className="w-9 h-9 p-0 rounded-full"
                    onClick={() => handleDayToggle(day.value)}
                    title={day.fullLabel}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {recurrenceType === 'monthly' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Monthly on</Label>
                <Select
                  value={monthlyType}
                  onValueChange={(value: 'day_of_month' | 'nth_weekday') => setMonthlyType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day_of_month">Day of month</SelectItem>
                    <SelectItem value="nth_weekday">Specific weekday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {monthlyType === 'day_of_month' && (
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select
                    value={monthlyDayOfMonth}
                    onValueChange={setMonthlyDayOfMonth}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {monthlyType === 'nth_weekday' && (
                <div className="flex gap-2">
                  <div className="space-y-2 flex-1">
                    <Label>Position</Label>
                    <Select
                      value={monthlyWeekPosition}
                      onValueChange={setMonthlyWeekPosition}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">First</SelectItem>
                        <SelectItem value="2">Second</SelectItem>
                        <SelectItem value="3">Third</SelectItem>
                        <SelectItem value="4">Fourth</SelectItem>
                        <SelectItem value="-1">Last</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label>Day</Label>
                    <Select
                      value={monthlyWeekday}
                      onValueChange={setMonthlyWeekday}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sunday</SelectItem>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Label>Ends</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="never"
                  checked={endType === 'never'}
                  onChange={() => setEndType('never')}
                  className="cursor-pointer"
                />
                <Label htmlFor="never" className="cursor-pointer font-normal">
                  Never
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="after"
                  checked={endType === 'after'}
                  onChange={() => setEndType('after')}
                  className="cursor-pointer"
                />
                <Label htmlFor="after" className="cursor-pointer font-normal">
                  After
                </Label>
                {endType === 'after' && (
                  <>
                    <Input
                      type="number"
                      min="1"
                      value={endCount}
                      onChange={(e) => setEndCount(e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">occurrences</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

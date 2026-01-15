'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { DatePreset } from '@/lib/types';
import { calculatePresetDate } from '@/lib/utils/recalibration-utils';
import { parseDateLocal } from '@/lib/utils/date-utils';
import { useState } from 'react';

interface DatePresetButtonsProps {
  currentDueDate: string;
  selectedDate: string | undefined;
  onDateChange: (date: string) => void;
}

export function DatePresetButtons({
  currentDueDate,
  selectedDate,
  onDateChange,
}: DatePresetButtonsProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handlePresetClick = (preset: DatePreset) => {
    const newDate = calculatePresetDate(preset);
    onDateChange(newDate);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onDateChange(`${year}-${month}-${day}`);
      setCalendarOpen(false);
    }
  };

  const isSelected = (preset: DatePreset): boolean => {
    if (!selectedDate) return false;
    return selectedDate === calculatePresetDate(preset);
  };

  const calendarDate = selectedDate ? parseDateLocal(selectedDate) : undefined;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant={isSelected('tomorrow') ? 'default' : 'outline'}
        onClick={() => handlePresetClick('tomorrow')}
        className="text-xs"
      >
        Tomorrow
      </Button>
      <Button
        type="button"
        size="sm"
        variant={isSelected('plus2') ? 'default' : 'outline'}
        onClick={() => handlePresetClick('plus2')}
        className="text-xs"
      >
        +2 Days
      </Button>
      <Button
        type="button"
        size="sm"
        variant={isSelected('plus7') ? 'default' : 'outline'}
        onClick={() => handlePresetClick('plus7')}
        className="text-xs"
      >
        +1 Week
      </Button>
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant={selectedDate && !isSelected('tomorrow') && !isSelected('plus2') && !isSelected('plus7') ? 'default' : 'outline'}
            className="text-xs"
          >
            <CalendarIcon className="h-3 w-3 mr-1" />
            Pick
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={calendarDate}
            onSelect={handleCalendarSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { DatePreset } from '@/lib/types';
import { calculatePresetDate } from '@/lib/utils/recalibration-utils';

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
  const handlePresetClick = (preset: DatePreset) => {
    const newDate = calculatePresetDate(preset);
    onDateChange(newDate);
  };

  const isSelected = (preset: DatePreset): boolean => {
    if (!selectedDate) return false;
    return selectedDate === calculatePresetDate(preset);
  };

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        variant={isSelected('tomorrow') ? 'default' : 'outline'}
        onClick={() => handlePresetClick('tomorrow')}
        className="text-xs h-7 flex-1"
      >
        Tomorrow
      </Button>
      <Button
        type="button"
        size="sm"
        variant={isSelected('plus3') ? 'default' : 'outline'}
        onClick={() => handlePresetClick('plus3')}
        className="text-xs h-7 flex-1"
      >
        +3 Days
      </Button>
      <Button
        type="button"
        size="sm"
        variant={isSelected('plus7') ? 'default' : 'outline'}
        onClick={() => handlePresetClick('plus7')}
        className="text-xs h-7 flex-1"
      >
        +1 Week
      </Button>
    </div>
  );
}

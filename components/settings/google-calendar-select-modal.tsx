'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarSlot } from '@/lib/types';
import { getDefaultSlotColor } from '@/lib/utils/calendar-utils';
import { Check, Loader2, Mail } from 'lucide-react';

interface GoogleCalendarListItem {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor?: string;
}

interface GoogleCalendarSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: CalendarSlot;
  calendars: GoogleCalendarListItem[];
  accountEmail: string;
  onSelect: (calendarId: string, calendarName: string, color: string) => void;
}

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

const SLOT_LABELS: Record<CalendarSlot, string> = {
  personal: 'Personal',
  work: 'Work',
  birthdays: 'Birthdays',
};

export function GoogleCalendarSelectModal({
  open,
  onOpenChange,
  slot,
  calendars,
  accountEmail,
  onSelect,
}: GoogleCalendarSelectModalProps) {
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(
    calendars.find(c => c.primary)?.id || calendars[0]?.id || null
  );
  const [color, setColor] = useState(getDefaultSlotColor(slot));
  const [isConnecting, setIsConnecting] = useState(false);

  const selectedCalendar = calendars.find(c => c.id === selectedCalendarId);

  const handleConnect = () => {
    if (!selectedCalendarId || !selectedCalendar) return;
    setIsConnecting(true);
    onSelect(selectedCalendarId, selectedCalendar.summary, color);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-sheet">
        <DialogHeader>
          <DialogTitle>Select Calendar</DialogTitle>
          <DialogDescription>
            Choose which calendar to use for {SLOT_LABELS[slot].toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Account info */}
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Mail className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {accountEmail}
            </span>
          </div>

          {/* Calendar list */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Available Calendars
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {calendars.map((calendar) => (
                <button
                  key={calendar.id}
                  onClick={() => setSelectedCalendarId(calendar.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedCalendarId === calendar.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-border hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: calendar.backgroundColor || '#3B82F6',
                      }}
                    />
                    <span className="text-sm text-slate-800 dark:text-slate-100 truncate">
                      {calendar.summary}
                    </span>
                    {calendar.primary && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        (Primary)
                      </span>
                    )}
                    {selectedCalendarId === calendar.id && (
                      <Check className="w-4 h-4 text-blue-500 ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Display Color
            </label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => setColor(presetColor)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: presetColor }}
                >
                  {presetColor === color && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!selectedCalendarId || isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

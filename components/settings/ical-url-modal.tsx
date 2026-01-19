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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarSlot } from '@/lib/types';
import { getDefaultSlotColor } from '@/lib/utils/calendar-utils';
import { Check, Loader2 } from 'lucide-react';

interface ICalUrlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: CalendarSlot;
  onConnect: (url: string, name: string, color: string) => void;
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

export function ICalUrlModal({
  open,
  onOpenChange,
  slot,
  onConnect,
}: ICalUrlModalProps) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState(getDefaultSlotColor(slot));
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:', 'webcal:', 'webcals:'].includes(urlObj.protocol)) {
        setError('Please enter a valid calendar URL (http, https, or webcal)');
        return;
      }
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsValidating(true);
    setError(null);

    // The validation will happen in the API call
    onConnect(url.trim(), name.trim() || 'iCal Calendar', color);
    setIsValidating(false);

    // Reset form
    setUrl('');
    setName('');
    setColor(getDefaultSlotColor(slot));
  };

  const handleClose = () => {
    setUrl('');
    setName('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="dialog-sheet">
        <DialogHeader>
          <DialogTitle>Connect iCal Calendar</DialogTitle>
          <DialogDescription>
            Enter the iCal subscription URL for your {SLOT_LABELS[slot].toLowerCase()} calendar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* URL input */}
          <div className="space-y-2">
            <Label htmlFor="ical-url">Calendar URL</Label>
            <Input
              id="ical-url"
              type="url"
              placeholder="https://calendar.google.com/calendar/ical/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="ical-name">Calendar Name (optional)</Label>
            <Input
              id="ical-name"
              type="text"
              placeholder="My Calendar"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label>Calendar Color</Label>
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

          {/* Help text */}
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <p className="font-medium">How to get your iCal URL:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Google Calendar:</strong> Settings → Calendar → Integrate calendar → Secret address in iCal format
              </li>
              <li>
                <strong>Apple Calendar:</strong> Right-click calendar → Share Calendar → Enable Public Calendar
              </li>
              <li>
                <strong>Outlook:</strong> Settings → View all Outlook settings → Shared calendars → Publish a calendar
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={isValidating}>
            {isValidating ? (
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

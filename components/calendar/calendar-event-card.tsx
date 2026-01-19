'use client';

import { CalendarEventWithCalendar } from '@/lib/types';
import { formatEventTime } from '@/lib/utils/calendar-utils';
import { MapPin, ExternalLink } from 'lucide-react';

interface CalendarEventCardProps {
  event: CalendarEventWithCalendar;
}

export function CalendarEventCard({ event }: CalendarEventCardProps) {
  const timeDisplay = formatEventTime(event);

  const handleClick = () => {
    if (event.event_url) {
      window.open(event.event_url, '_blank');
    }
  };

  return (
    <div
      className={`p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 ${
        event.event_url ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800' : ''
      }`}
      onClick={event.event_url ? handleClick : undefined}
    >
      <div className="flex items-start gap-2">
        {/* Color dot */}
        <div
          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
          style={{ backgroundColor: event.calendar?.color || '#3B82F6' }}
        />

        <div className="flex-1 min-w-0">
          {/* Time */}
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {timeDisplay}
          </p>

          {/* Title */}
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
            {event.title}
          </p>

          {/* Location (if present) */}
          {event.location && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {event.location}
              </p>
            </div>
          )}
        </div>

        {/* External link indicator */}
        {event.event_url && (
          <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

'use client';

import { CalendarEventWithCalendar, ConnectedCalendar } from '@/lib/types';
import { CalendarEventCard } from './calendar-event-card';
import { sortEventsByTime } from '@/lib/utils/calendar-utils';
import { Button } from '@/components/ui/button';
import { CalendarDays, RefreshCw, Settings } from 'lucide-react';
import Link from 'next/link';

interface CalendarSectionProps {
  events: CalendarEventWithCalendar[];
  connections: ConnectedCalendar[];
  lastSyncedAt: string | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  hideHeader?: boolean;
}

export function CalendarSection({
  events,
  connections,
  lastSyncedAt,
  isLoading = false,
  onRefresh,
  hideHeader = false,
}: CalendarSectionProps) {
  const sortedEvents = sortEventsByTime(events);
  const hasConnections = connections.length > 0;

  // Separate all-day events from timed events
  const allDayEvents = sortedEvents.filter(e => e.is_all_day);
  const timedEvents = sortedEvents.filter(e => !e.is_all_day);

  return (
    <div className="space-y-3">
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Today's Schedule
          </h2>
          {hasConnections && onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      {!hasConnections ? (
        // Empty state - no calendars connected
        <div className="text-center py-6 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <CalendarDays className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No calendars connected
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Connect a calendar to see your schedule
            </p>
          </div>
          <Link href="/settings">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Connect Calendar
            </Button>
          </Link>
        </div>
      ) : events.length === 0 ? (
        // Empty state - no events today
        <div className="text-center py-6 text-muted-foreground">
          <CalendarDays className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm">No events scheduled today</p>
        </div>
      ) : (
        // Events list
        <div className="space-y-2">
          {/* All-day events first */}
          {allDayEvents.length > 0 && (
            <div className="space-y-1">
              {allDayEvents.map((event) => (
                <CalendarEventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          {/* Timed events */}
          {timedEvents.length > 0 && (
            <div className="space-y-1">
              {timedEvents.map((event) => (
                <CalendarEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Last synced info */}
      {hasConnections && lastSyncedAt && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Last synced {new Date(lastSyncedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
}

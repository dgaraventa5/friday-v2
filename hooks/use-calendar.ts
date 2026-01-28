'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarEventWithCalendar, ConnectedCalendar, TodayCalendarData } from '@/lib/types';

// Refresh interval: 1 hour (matches server-side cron)
const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

interface UseCalendarReturn {
  events: CalendarEventWithCalendar[];
  connections: ConnectedCalendar[];
  lastSyncedAt: string | null;
  syncError: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useCalendar(initialData?: TodayCalendarData): UseCalendarReturn {
  const [events, setEvents] = useState<CalendarEventWithCalendar[]>(initialData?.events || []);
  const [connections, setConnections] = useState<ConnectedCalendar[]>(initialData?.connections || []);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(initialData?.lastSyncedAt || null);
  const [syncError, setSyncError] = useState<string | null>(initialData?.syncError || null);
  const [isLoading, setIsLoading] = useState(false);
  const isRefreshingRef = useRef(false);

  const fetchCalendarData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/calendar/events');
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      setEvents(data.events || []);
      setConnections(data.connections || []);
      setLastSyncedAt(data.lastSyncedAt);
      setSyncError(data.syncError);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setSyncError(error instanceof Error ? error.message : 'Failed to fetch calendar');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    // Trigger a sync first
    try {
      await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } catch (error) {
      console.error('Error syncing calendars:', error);
    }

    // Then fetch the updated data
    await fetchCalendarData();
  }, [fetchCalendarData]);

  // Update state when initialData changes (e.g., from server refresh)
  useEffect(() => {
    if (initialData) {
      setEvents(initialData.events || []);
      setConnections(initialData.connections || []);
      setLastSyncedAt(initialData.lastSyncedAt || null);
      setSyncError(initialData.syncError || null);
    }
  }, [initialData]);

  // Auto-refresh on interval and when tab regains focus
  useEffect(() => {
    // Only set up auto-refresh if there are connections
    if (connections.length === 0) {
      return;
    }

    // Silent refresh (doesn't show loading state, just fetches data)
    const silentRefresh = async () => {
      if (isRefreshingRef.current) return;
      isRefreshingRef.current = true;
      try {
        const response = await fetch('/api/calendar/events');
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
          setConnections(data.connections || []);
          setLastSyncedAt(data.lastSyncedAt);
          setSyncError(data.syncError);
        }
      } catch (error) {
        console.error('Error during silent calendar refresh:', error);
      } finally {
        isRefreshingRef.current = false;
      }
    };

    // Set up interval for periodic refresh
    const intervalId = setInterval(silentRefresh, REFRESH_INTERVAL_MS);

    // Refresh when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        silentRefresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connections.length]);

  return {
    events,
    connections,
    lastSyncedAt,
    syncError,
    isLoading,
    refresh,
  };
}

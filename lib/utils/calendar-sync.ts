import { SupabaseClient } from '@supabase/supabase-js';
import { ConnectedCalendar } from '../types';
import { CalendarService } from '../services/calendar-service';
import { CalendarEventsService } from '../services/calendar-events-service';
import {
  fetchCalendarEvents,
  refreshAccessToken,
  isTokenExpired,
  GoogleCalendarEvent,
} from '../google/calendar-client';
import { fetchAndParseICalUrl, ParsedEvent } from './ical-parser';
import { addDays, subDays, startOfDay, endOfDay } from 'date-fns';

// Sync window: 7 days back, 30 days forward
const SYNC_DAYS_BACK = 7;
const SYNC_DAYS_FORWARD = 30;

export interface SyncResult {
  success: boolean;
  eventsUpserted: number;
  error?: string;
}

/**
 * Sync a single calendar connection
 */
export async function syncCalendar(
  supabase: SupabaseClient,
  connection: ConnectedCalendar
): Promise<SyncResult> {
  const calendarService = new CalendarService(supabase);
  const eventsService = new CalendarEventsService(supabase);

  const now = new Date();
  const rangeStart = subDays(startOfDay(now), SYNC_DAYS_BACK);
  const rangeEnd = addDays(endOfDay(now), SYNC_DAYS_FORWARD);

  try {
    let events: (GoogleCalendarEvent | ParsedEvent)[] = [];

    if (connection.connection_type === 'google') {
      // Handle Google Calendar sync
      const result = await syncGoogleCalendar(supabase, connection, rangeStart, rangeEnd);
      if (!result.success) {
        // Update connection with error
        await calendarService.updateConnection(connection.id, {
          sync_error: result.error,
        });
        return result;
      }
      events = result.events || [];
    } else if (connection.connection_type === 'ical_url') {
      // Handle iCal URL sync
      if (!connection.ical_url) {
        return { success: false, eventsUpserted: 0, error: 'No iCal URL configured' };
      }

      const result = await fetchAndParseICalUrl(connection.ical_url, rangeStart, rangeEnd);
      if (!result.success) {
        await calendarService.updateConnection(connection.id, {
          sync_error: result.error,
        });
        return { success: false, eventsUpserted: 0, error: result.error };
      }
      events = result.events || [];
    }

    // Upsert events
    const upsertResult = await eventsService.upsertEvents(
      connection.id,
      events.map(event => ({
        external_id: event.external_id,
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        is_all_day: event.is_all_day,
        status: event.status,
        location: event.location,
        event_url: event.event_url,
      }))
    );

    if (upsertResult.error) {
      await calendarService.updateConnection(connection.id, {
        sync_error: upsertResult.error.message,
      });
      return { success: false, eventsUpserted: 0, error: upsertResult.error.message };
    }

    // Clean up old events outside sync window
    await eventsService.deleteEventsOutsideRange(
      connection.id,
      rangeStart.toISOString(),
      rangeEnd.toISOString()
    );

    // Update connection with success
    await calendarService.updateConnection(connection.id, {
      last_synced_at: new Date().toISOString(),
      sync_error: null,
    });

    return {
      success: true,
      eventsUpserted: upsertResult.data?.length || 0,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
    await calendarService.updateConnection(connection.id, {
      sync_error: errorMessage,
    });
    return { success: false, eventsUpserted: 0, error: errorMessage };
  }
}

/**
 * Sync a Google Calendar, handling token refresh if needed
 */
async function syncGoogleCalendar(
  supabase: SupabaseClient,
  connection: ConnectedCalendar,
  rangeStart: Date,
  rangeEnd: Date
): Promise<{ success: boolean; events?: GoogleCalendarEvent[]; error?: string }> {
  const calendarService = new CalendarService(supabase);

  if (!connection.google_calendar_id || !connection.google_access_token) {
    return { success: false, error: 'Missing Google calendar configuration' };
  }

  let accessToken = connection.google_access_token;

  // Check if token needs refresh
  if (isTokenExpired(connection.google_token_expiry)) {
    if (!connection.google_refresh_token) {
      return { success: false, error: 'Token expired and no refresh token available' };
    }

    try {
      const refreshed = await refreshAccessToken(connection.google_refresh_token);
      accessToken = refreshed.access_token;

      // Update connection with new token
      await calendarService.updateConnection(connection.id, {
        google_access_token: refreshed.access_token,
        google_token_expiry: new Date(refreshed.expiry_date).toISOString(),
      });
    } catch (error) {
      return {
        success: false,
        error: `Failed to refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  try {
    const events = await fetchCalendarEvents(
      accessToken,
      connection.google_calendar_id,
      rangeStart,
      rangeEnd
    );
    return { success: true, events };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch events: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Sync all calendars for a user
 */
export async function syncAllUserCalendars(
  supabase: SupabaseClient,
  userId: string
): Promise<{ results: Map<string, SyncResult> }> {
  const calendarService = new CalendarService(supabase);
  const results = new Map<string, SyncResult>();

  const connectionsResult = await calendarService.getConnectionsByUserId(userId);
  if (connectionsResult.error || !connectionsResult.data) {
    return { results };
  }

  for (const connection of connectionsResult.data) {
    if (!connection.is_active) {
      continue;
    }

    const result = await syncCalendar(supabase, connection);
    results.set(connection.id, result);
  }

  return { results };
}

/**
 * Sync all active calendars (for cron job)
 * Note: Requires service role client for cross-user access
 */
export async function syncAllActiveCalendars(
  supabase: SupabaseClient
): Promise<{ total: number; succeeded: number; failed: number; errors: string[] }> {
  const calendarService = new CalendarService(supabase);
  const errors: string[] = [];

  const connectionsResult = await calendarService.getActiveConnections();
  if (connectionsResult.error || !connectionsResult.data) {
    return {
      total: 0,
      succeeded: 0,
      failed: 0,
      errors: [connectionsResult.error?.message || 'Failed to fetch connections'],
    };
  }

  let succeeded = 0;
  let failed = 0;

  for (const connection of connectionsResult.data) {
    const result = await syncCalendar(supabase, connection);
    if (result.success) {
      succeeded++;
    } else {
      failed++;
      if (result.error) {
        errors.push(`${connection.id}: ${result.error}`);
      }
    }
  }

  return {
    total: connectionsResult.data.length,
    succeeded,
    failed,
    errors,
  };
}

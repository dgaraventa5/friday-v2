import { SupabaseClient } from '@supabase/supabase-js';
import { BaseService } from './base-service';
import { ServiceResult, createSuccessResult, createErrorResult } from './types';
import { CalendarEvent, CalendarEventWithCalendar } from '../types';

/**
 * Interface defining all calendar event operations
 */
export interface ICalendarEventsService {
  getEventsByCalendarId(calendarId: string): Promise<ServiceResult<CalendarEvent[]>>;
  getEventsByDateRange(calendarId: string, startDate: string, endDate: string): Promise<ServiceResult<CalendarEvent[]>>;
  getTodayEventsForUser(userId: string, todayStart: string, todayEnd: string): Promise<ServiceResult<CalendarEventWithCalendar[]>>;
  upsertEvents(calendarId: string, events: Partial<CalendarEvent>[]): Promise<ServiceResult<CalendarEvent[]>>;
  deleteEventsOutsideRange(calendarId: string, startDate: string, endDate: string): Promise<ServiceResult<void>>;
  deleteEventsByCalendarId(calendarId: string): Promise<ServiceResult<void>>;
}

/**
 * Service for managing calendar event operations
 * Encapsulates all Supabase interactions for calendar_events
 */
export class CalendarEventsService extends BaseService implements ICalendarEventsService {
  private readonly TABLE = 'calendar_events';
  private readonly CALENDARS_TABLE = 'connected_calendars';

  /**
   * Get all events for a specific calendar
   */
  async getEventsByCalendarId(calendarId: string): Promise<ServiceResult<CalendarEvent[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.TABLE)
        .select('*')
        .eq('calendar_id', calendarId)
        .order('start_time', { ascending: true });

      if (error) {
        const err = this.handleError(error, 'Failed to fetch calendar events');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as CalendarEvent[]);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error fetching calendar events');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Get events within a date range for a specific calendar
   */
  async getEventsByDateRange(
    calendarId: string,
    startDate: string,
    endDate: string
  ): Promise<ServiceResult<CalendarEvent[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.TABLE)
        .select('*')
        .eq('calendar_id', calendarId)
        .gte('start_time', startDate)
        .lte('end_time', endDate)
        .order('start_time', { ascending: true });

      if (error) {
        const err = this.handleError(error, 'Failed to fetch calendar events by date range');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as CalendarEvent[]);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error fetching calendar events');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Get today's events for a user with calendar info
   */
  async getTodayEventsForUser(
    userId: string,
    todayStart: string,
    todayEnd: string
  ): Promise<ServiceResult<CalendarEventWithCalendar[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.TABLE)
        .select(`
          *,
          calendar:connected_calendars!inner(id, name, color, slot)
        `)
        .eq('calendar.user_id', userId)
        .eq('calendar.is_active', true)
        .or(`and(start_time.gte.${todayStart},start_time.lt.${todayEnd}),and(start_time.lt.${todayStart},end_time.gt.${todayStart})`)
        .order('start_time', { ascending: true });

      if (error) {
        const err = this.handleError(error, 'Failed to fetch today\'s calendar events');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as CalendarEventWithCalendar[]);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error fetching today\'s calendar events');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Upsert events from a calendar sync
   */
  async upsertEvents(calendarId: string, events: Partial<CalendarEvent>[]): Promise<ServiceResult<CalendarEvent[]>> {
    if (events.length === 0) {
      return createSuccessResult([]);
    }

    try {
      // Ensure all events have the calendar_id set
      const eventsWithCalendar = events.map(event => ({
        ...event,
        calendar_id: calendarId,
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await this.supabase
        .from(this.TABLE)
        .upsert(eventsWithCalendar, {
          onConflict: 'calendar_id,external_id'
        })
        .select();

      if (error) {
        const err = this.handleError(error, 'Failed to upsert calendar events');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(data as CalendarEvent[]);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error upserting calendar events');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Delete events outside a date range (for cleanup after sync)
   */
  async deleteEventsOutsideRange(
    calendarId: string,
    startDate: string,
    endDate: string
  ): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.supabase
        .from(this.TABLE)
        .delete()
        .eq('calendar_id', calendarId)
        .or(`start_time.lt.${startDate},start_time.gt.${endDate}`);

      if (error) {
        const err = this.handleError(error, 'Failed to delete old calendar events');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(undefined as void);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error deleting old calendar events');
      this.logError(err);
      return createErrorResult(err);
    }
  }

  /**
   * Delete all events for a calendar
   */
  async deleteEventsByCalendarId(calendarId: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.supabase
        .from(this.TABLE)
        .delete()
        .eq('calendar_id', calendarId);

      if (error) {
        const err = this.handleError(error, 'Failed to delete calendar events');
        this.logError(err);
        return createErrorResult(err);
      }

      return createSuccessResult(undefined as void);
    } catch (error) {
      const err = this.handleError(error, 'Unexpected error deleting calendar events');
      this.logError(err);
      return createErrorResult(err);
    }
  }

}

/**
 * Factory function to create a CalendarEventsService instance
 */
export function createCalendarEventsService(supabase: SupabaseClient): CalendarEventsService {
  return new CalendarEventsService(supabase);
}

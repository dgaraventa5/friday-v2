import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCalendarService } from '@/lib/services/calendar-service';
import { createCalendarEventsService } from '@/lib/services/calendar-events-service';
import { getTodayForTimezone, getDayBoundsUTC } from '@/lib/utils/date-utils';
import { createProfileService } from '@/lib/services/profile-service';

/**
 * GET /api/calendar/events
 * Get today's calendar events for the current user
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's timezone from profile
    const profileService = createProfileService(supabase);
    const profileResult = await profileService.getProfile(user.id);
    const timezone = profileResult.data?.timezone || 'America/Los_Angeles';

    // Calculate today's date range in user's timezone (as UTC bounds)
    const today = getTodayForTimezone(timezone);
    const { start: todayStart, end: todayEnd } = getDayBoundsUTC(today, timezone);

    // Get calendar connections
    const calendarService = createCalendarService(supabase);
    const connectionsResult = await calendarService.getConnectionsByUserId(user.id);

    if (connectionsResult.error) {
      console.error('Error fetching connections:', connectionsResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch calendar connections' },
        { status: 500 }
      );
    }

    // Get today's events
    const eventsService = createCalendarEventsService(supabase);
    const eventsResult = await eventsService.getTodayEventsForUser(user.id, todayStart, todayEnd);

    if (eventsResult.error) {
      console.error('Error fetching events:', eventsResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch calendar events' },
        { status: 500 }
      );
    }

    // Calculate last synced time (most recent across all calendars)
    const connections = connectionsResult.data || [];
    const lastSyncedAt = connections.reduce((latest, conn) => {
      if (!conn.last_synced_at) return latest;
      if (!latest) return conn.last_synced_at;
      return conn.last_synced_at > latest ? conn.last_synced_at : latest;
    }, null as string | null);

    // Check for any sync errors
    const syncError = connections.find(c => c.sync_error)?.sync_error || null;

    return NextResponse.json({
      events: eventsResult.data || [],
      connections,
      lastSyncedAt,
      syncError,
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCalendarService } from '@/lib/services/calendar-service';
import { syncCalendar, syncAllUserCalendars } from '@/lib/utils/calendar-sync';
import { CalendarSlot } from '@/lib/types';
import { verifyOrigin } from '@/lib/utils/security';

/**
 * POST /api/calendar/sync
 * Manually trigger calendar sync
 * Optional: specify slot to sync only that calendar
 */
export async function POST(request: Request) {
  // Verify origin to prevent CSRF
  const originError = verifyOrigin(request);
  if (originError) return originError;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const slot = body.slot as CalendarSlot | undefined;

    const calendarService = createCalendarService(supabase);

    if (slot) {
      // Sync specific slot
      if (!['personal', 'work'].includes(slot)) {
        return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });
      }

      const connectionResult = await calendarService.getConnectionBySlot(user.id, slot);
      if (!connectionResult.data) {
        return NextResponse.json({ error: 'No calendar connected to this slot' }, { status: 404 });
      }

      const syncResult = await syncCalendar(supabase, connectionResult.data);

      return NextResponse.json({
        success: syncResult.success,
        results: {
          [slot]: syncResult,
        },
      });
    } else {
      // Sync all user calendars
      const { results } = await syncAllUserCalendars(supabase, user.id);

      const resultsObject: Record<string, { success: boolean; eventsUpserted?: number; error?: string }> = {};
      results.forEach((result, calendarId) => {
        resultsObject[calendarId] = result;
      });

      const allSucceeded = Array.from(results.values()).every(r => r.success);

      return NextResponse.json({
        success: allSucceeded,
        results: resultsObject,
      });
    }
  } catch (error) {
    console.error('Error syncing calendars:', error);
    return NextResponse.json(
      { error: 'Failed to sync calendars' },
      { status: 500 }
    );
  }
}

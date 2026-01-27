import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCalendarService } from '@/lib/services/calendar-service';
import { validateICalUrl } from '@/lib/utils/ical-parser';
import { syncCalendar } from '@/lib/utils/calendar-sync';
import { CalendarSlot } from '@/lib/types';
import { getDefaultSlotColor } from '@/lib/utils/calendar-utils';
import { verifyOrigin } from '@/lib/utils/security';

interface ConnectRequest {
  slot: CalendarSlot;
  url: string;
  name?: string;
  color?: string;
}

/**
 * POST /api/calendar/ical/connect
 * Connect an iCal URL calendar
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

    const body: ConnectRequest = await request.json();
    const { slot, url, name, color } = body;

    // Validate slot
    if (!slot || !['personal', 'work'].includes(slot)) {
      return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });
    }

    // Validate URL
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate the iCal URL
    const validation = await validateICalUrl(url);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid iCal URL' },
        { status: 400 }
      );
    }

    const calendarService = createCalendarService(supabase);

    // Check if slot already has a connection
    const existingResult = await calendarService.getConnectionBySlot(user.id, slot);
    if (existingResult.data) {
      // Delete existing connection first
      await calendarService.deleteConnection(existingResult.data.id);
    }

    // Create new connection
    const calendarName = name || validation.calendarName || 'iCal Calendar';
    const connectionResult = await calendarService.createConnection({
      user_id: user.id,
      slot,
      connection_type: 'ical_url',
      name: calendarName,
      color: color || getDefaultSlotColor(slot),
      ical_url: url,
      is_active: true,
    });

    if (connectionResult.error) {
      console.error('Error creating connection:', connectionResult.error);
      return NextResponse.json(
        { error: 'Failed to create calendar connection' },
        { status: 500 }
      );
    }

    // Trigger initial sync
    const syncResult = await syncCalendar(supabase, connectionResult.data!);

    return NextResponse.json({
      success: true,
      connection: connectionResult.data,
      syncResult: {
        eventsUpserted: syncResult.eventsUpserted,
      },
    });
  } catch (error) {
    console.error('Error connecting iCal calendar:', error);
    return NextResponse.json(
      { error: 'Failed to connect calendar' },
      { status: 500 }
    );
  }
}

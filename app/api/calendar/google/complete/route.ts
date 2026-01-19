import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCalendarService } from '@/lib/services/calendar-service';
import { syncCalendar } from '@/lib/utils/calendar-sync';
import { CalendarSlot } from '@/lib/types';
import { getDefaultSlotColor } from '@/lib/utils/calendar-utils';

interface CompleteRequest {
  slot: CalendarSlot;
  calendarId: string;
  calendarName: string;
  color?: string;
  tokens: {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
    google_account_id: string;
    google_account_email: string;
  };
}

/**
 * POST /api/calendar/google/complete
 * Complete Google calendar connection after OAuth and calendar selection
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CompleteRequest = await request.json();
    const { slot, calendarId, calendarName, color, tokens } = body;

    // Validate slot
    if (!slot || !['personal', 'work'].includes(slot)) {
      return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });
    }

    // Validate required fields
    if (!calendarId || !calendarName || !tokens) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const calendarService = createCalendarService(supabase);

    // Check if slot already has a connection
    const existingResult = await calendarService.getConnectionBySlot(user.id, slot);
    if (existingResult.data) {
      // Delete existing connection first
      await calendarService.deleteConnection(existingResult.data.id);
    }

    // Create new connection
    const connectionResult = await calendarService.createConnection({
      user_id: user.id,
      slot,
      connection_type: 'google',
      name: calendarName,
      color: color || getDefaultSlotColor(slot),
      google_account_id: tokens.google_account_id,
      google_account_email: tokens.google_account_email,
      google_calendar_id: calendarId,
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token,
      google_token_expiry: new Date(tokens.expiry_date).toISOString(),
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
    console.error('Error completing Google calendar connection:', error);
    return NextResponse.json(
      { error: 'Failed to complete calendar connection' },
      { status: 500 }
    );
  }
}

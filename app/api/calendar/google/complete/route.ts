import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCalendarService } from '@/lib/services/calendar-service';
import { syncCalendar } from '@/lib/utils/calendar-sync';
import { CalendarSlot } from '@/lib/types';
import { getDefaultSlotColor } from '@/lib/utils/calendar-utils';
import { verifyOrigin } from '@/lib/utils/security';

interface CompleteRequest {
  sessionId: string;
  calendarId: string;
  calendarName: string;
  color?: string;
}

/**
 * POST /api/calendar/google/complete
 * Complete Google calendar connection after OAuth and calendar selection
 * Tokens are retrieved from secure server-side session storage
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

    const body: CompleteRequest = await request.json();
    const { sessionId, calendarId, calendarName, color } = body;

    // Validate required fields
    if (!sessionId || !calendarId || !calendarName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Retrieve tokens from secure server-side session storage
    const { data: session, error: sessionError } = await supabase
      .from('oauth_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      await supabase.from('oauth_sessions').delete().eq('id', sessionId);
      return NextResponse.json({ error: 'Session expired' }, { status: 410 });
    }

    const slot = session.slot as CalendarSlot;

    // Validate slot
    if (!slot || !['personal', 'work'].includes(slot)) {
      return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });
    }

    const calendarService = createCalendarService(supabase);

    // Check if slot already has a connection
    const existingResult = await calendarService.getConnectionBySlot(user.id, slot);
    if (existingResult.data) {
      // Delete existing connection first
      await calendarService.deleteConnection(existingResult.data.id);
    }

    // Create new connection with tokens from secure session storage
    const connectionResult = await calendarService.createConnection({
      user_id: user.id,
      slot,
      connection_type: 'google',
      name: calendarName,
      color: color || getDefaultSlotColor(slot),
      google_account_id: session.google_account_id,
      google_account_email: session.google_account_email,
      google_calendar_id: calendarId,
      google_access_token: session.access_token,
      google_refresh_token: session.refresh_token,
      google_token_expiry: new Date(session.expiry_date).toISOString(),
      is_active: true,
    });

    if (connectionResult.error) {
      console.error('Error creating connection:', connectionResult.error);
      return NextResponse.json(
        { error: 'Failed to create calendar connection' },
        { status: 500 }
      );
    }

    // Delete the OAuth session now that we're done with it
    await supabase.from('oauth_sessions').delete().eq('id', sessionId);

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

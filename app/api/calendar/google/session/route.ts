import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/calendar/google/session
 * Retrieve OAuth session data (calendars) for calendar selection UI
 * Tokens are NOT returned - they are retrieved directly in the complete endpoint
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Retrieve session - only return non-sensitive data (calendars, slot)
    const { data: session, error } = await supabase
      .from('oauth_sessions')
      .select('id, slot, calendars, google_account_email, expires_at')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await supabase.from('oauth_sessions').delete().eq('id', sessionId);
      return NextResponse.json({ error: 'Session expired' }, { status: 410 });
    }

    return NextResponse.json({
      slot: session.slot,
      calendars: session.calendars,
      googleAccountEmail: session.google_account_email,
    });
  } catch (error) {
    console.error('Error retrieving OAuth session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calendar/google/session
 * Clean up OAuth session after completion or cancellation
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    await supabase
      .from('oauth_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting OAuth session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

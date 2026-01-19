import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUrl } from '@/lib/google/calendar-client';
import { CalendarSlot } from '@/lib/types';

/**
 * GET /api/calendar/google/auth
 * Start Google OAuth flow for calendar connection
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get slot from query params
    const { searchParams } = new URL(request.url);
    const slot = searchParams.get('slot') as CalendarSlot;

    if (!slot || !['personal', 'work'].includes(slot)) {
      return NextResponse.json({ error: 'Invalid slot parameter' }, { status: 400 });
    }

    // Create state with user ID and slot for callback
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      slot,
    })).toString('base64');

    const authUrl = getAuthUrl(state);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error starting Google OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to start Google OAuth' },
      { status: 500 }
    );
  }
}

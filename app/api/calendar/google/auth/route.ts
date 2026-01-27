import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHmac } from 'crypto';
import { getAuthUrl } from '@/lib/google/calendar-client';
import { CalendarSlot } from '@/lib/types';

/**
 * Generate HMAC-signed OAuth state to prevent CSRF attacks
 */
function generateSignedState(userId: string, slot: CalendarSlot): string {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) {
    throw new Error('OAUTH_STATE_SECRET not configured');
  }

  const payload = JSON.stringify({
    userId,
    slot,
    timestamp: Date.now(),
  });

  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
}

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

    // Create HMAC-signed state to prevent CSRF attacks
    const state = generateSignedState(user.id, slot);

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

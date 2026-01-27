import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  getTokensFromCode,
  getGoogleUserInfo,
  listUserCalendars,
} from '@/lib/google/calendar-client';
import { CalendarSlot } from '@/lib/types';

/**
 * Verify HMAC signature of OAuth state
 */
function verifyOAuthState(state: string): { userId: string; slot: CalendarSlot } | null {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
    const { payload, signature } = decoded;

    if (!payload || !signature) {
      return null;
    }

    const secret = process.env.OAUTH_STATE_SECRET;
    if (!secret) {
      console.error('OAUTH_STATE_SECRET not configured');
      return null;
    }

    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return null;
    }

    // Verify timestamp to prevent replay attacks (10 minute window)
    const data = JSON.parse(payload);
    const timestamp = data.timestamp;
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;

    if (!timestamp || now - timestamp > tenMinutes) {
      return null;
    }

    return { userId: data.userId, slot: data.slot };
  } catch {
    return null;
  }
}

/**
 * GET /api/calendar/google/callback
 * Handle Google OAuth callback
 * Exchanges code for tokens and stores them server-side
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL('/settings?error=OAuth%20authorization%20failed', request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?error=Missing%20OAuth%20parameters', request.url)
      );
    }

    // Verify signed state
    const stateData = verifyOAuthState(state);
    if (!stateData) {
      return NextResponse.redirect(
        new URL('/settings?error=Invalid%20OAuth%20state', request.url)
      );
    }

    // Verify user is still logged in
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.id !== stateData.userId) {
      return NextResponse.redirect(
        new URL('/settings?error=Session%20expired', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Get Google user info
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    // Get list of calendars
    const calendars = await listUserCalendars(tokens.access_token);

    // Store tokens server-side in oauth_sessions table (expires in 5 minutes)
    // This prevents tokens from being exposed in URL, browser history, or referrer headers
    const { data: session, error: sessionError } = await supabase
      .from('oauth_sessions')
      .upsert({
        user_id: user.id,
        slot: stateData.slot,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        google_account_id: googleUser.id,
        google_account_email: googleUser.email,
        calendars: calendars,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      }, {
        onConflict: 'user_id,slot',
      })
      .select('id')
      .single();

    if (sessionError || !session) {
      console.error('Error storing OAuth session:', sessionError);
      return NextResponse.redirect(
        new URL('/settings?error=Failed%20to%20store%20session', request.url)
      );
    }

    // Redirect with only session ID - tokens stay server-side
    return NextResponse.redirect(
      new URL(
        `/settings?google_callback=true&slot=${stateData.slot}&oauth_session=${session.id}`,
        request.url
      )
    );
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/settings?error=OAuth%20failed', request.url)
    );
  }
}

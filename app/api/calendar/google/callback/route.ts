import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getTokensFromCode,
  getGoogleUserInfo,
  listUserCalendars,
} from '@/lib/google/calendar-client';
import { CalendarSlot } from '@/lib/types';

/**
 * GET /api/calendar/google/callback
 * Handle Google OAuth callback
 * Exchanges code for tokens and returns calendar list for selection
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || error;
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(errorDescription)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?error=Missing%20OAuth%20parameters', request.url)
      );
    }

    // Decode state
    let stateData: { userId: string; slot: CalendarSlot };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
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

    // Store tokens temporarily in session storage via URL params
    // The complete endpoint will use these to create the connection
    const tokenData = Buffer.from(JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      google_account_id: googleUser.id,
      google_account_email: googleUser.email,
    })).toString('base64');

    const calendarsData = Buffer.from(JSON.stringify(calendars)).toString('base64');

    // Redirect to settings with data for calendar selection
    return NextResponse.redirect(
      new URL(
        `/settings?google_callback=true&slot=${stateData.slot}&tokens=${tokenData}&calendars=${calendarsData}`,
        request.url
      )
    );
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'OAuth failed';
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}

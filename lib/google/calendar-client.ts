import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Environment variables for Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI;

// Scopes required for calendar read-only access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

export interface GoogleUserInfo {
  id: string;
  email: string;
}

export interface GoogleCalendarListItem {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor?: string;
}

export interface GoogleCalendarEvent {
  external_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  status: 'busy' | 'free' | 'tentative';
  location: string | null;
  event_url: string | null;
}

/**
 * Create an OAuth2 client for Google API
 */
export function createOAuth2Client(): OAuth2Client {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error('Missing Google OAuth credentials in environment variables');
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate the OAuth authorization URL
 * Forces account picker to allow connecting different accounts to different slots
 */
export function getAuthUrl(state: string): string {
  const oauth2Client = createOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'select_account consent', // Force account picker and consent
    state,
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}> {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to get tokens from authorization code');
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
  };
}

/**
 * Get user info (email and ID) from access token
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  if (!data.id || !data.email) {
    throw new Error('Failed to get user info from Google');
  }

  return {
    id: data.id,
    email: data.email,
  };
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expiry_date: number;
}> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token');
  }

  return {
    access_token: credentials.access_token,
    expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
  };
}

/**
 * List all calendars the user has access to
 */
export async function listUserCalendars(accessToken: string): Promise<GoogleCalendarListItem[]> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const { data } = await calendar.calendarList.list();

  if (!data.items) {
    return [];
  }

  return data.items
    .filter(item => item.id && item.summary)
    .map(item => ({
      id: item.id!,
      summary: item.summary!,
      primary: item.primary || false,
      backgroundColor: item.backgroundColor || undefined,
    }));
}

/**
 * Fetch events from a specific calendar within a date range
 */
export async function fetchCalendarEvents(
  accessToken: string,
  calendarId: string,
  startDate: Date,
  endDate: Date
): Promise<GoogleCalendarEvent[]> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const events: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined;

  do {
    const response = await calendar.events.list({
      calendarId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true, // Expand recurring events
      orderBy: 'startTime',
      maxResults: 250,
      pageToken,
    });

    if (response.data.items) {
      for (const item of response.data.items) {
        const parsed = parseGoogleEvent(item);
        if (parsed) {
          events.push(parsed);
        }
      }
    }

    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return events;
}

/**
 * Parse a Google Calendar event into our format
 */
function parseGoogleEvent(event: calendar_v3.Schema$Event): GoogleCalendarEvent | null {
  if (!event.id || !event.summary) {
    return null;
  }

  // Determine if it's an all-day event
  const isAllDay = !!event.start?.date && !event.start?.dateTime;

  // Get start and end times
  let startTime: string;
  let endTime: string;

  if (isAllDay) {
    // All-day events have date without time
    startTime = new Date(`${event.start!.date}T00:00:00`).toISOString();
    endTime = new Date(`${event.end!.date}T00:00:00`).toISOString();
  } else {
    startTime = event.start?.dateTime || '';
    endTime = event.end?.dateTime || '';
  }

  if (!startTime || !endTime) {
    return null;
  }

  // Determine status
  let status: 'busy' | 'free' | 'tentative' = 'busy';
  if (event.transparency === 'transparent') {
    status = 'free';
  }
  if (event.status === 'tentative') {
    status = 'tentative';
  }

  return {
    external_id: event.id,
    title: event.summary,
    description: event.description || null,
    start_time: startTime,
    end_time: endTime,
    is_all_day: isAllDay,
    status,
    location: event.location || null,
    event_url: event.htmlLink || null,
  };
}

/**
 * Check if access token needs refresh (expires within 5 minutes)
 */
export function isTokenExpired(expiryDate: string | null): boolean {
  if (!expiryDate) {
    return true;
  }

  const expiry = new Date(expiryDate);
  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000;

  return expiry.getTime() - now.getTime() < fiveMinutes;
}

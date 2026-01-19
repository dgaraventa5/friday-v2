import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncAllActiveCalendars } from '@/lib/utils/calendar-sync';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/cron/sync-calendars
 * Background job to sync all active calendars
 * Protected by CRON_SECRET
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Accept both Bearer token and x-cron-secret header (Vercel cron)
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` ||
      request.headers.get('x-cron-secret') === cronSecret;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting calendar sync job');

    const supabaseAdmin = getSupabaseAdmin();
    const result = await syncAllActiveCalendars(supabaseAdmin);

    console.log(`[Cron] Calendar sync complete: ${result.succeeded}/${result.total} succeeded`);

    if (result.errors.length > 0) {
      console.error('[Cron] Sync errors:', result.errors);
    }

    return NextResponse.json({
      success: result.failed === 0,
      total: result.total,
      succeeded: result.succeeded,
      failed: result.failed,
      errors: result.errors.slice(0, 10), // Limit errors in response
    });
  } catch (error) {
    console.error('[Cron] Calendar sync job failed:', error);
    return NextResponse.json(
      { error: 'Sync job failed' },
      { status: 500 }
    );
  }
}

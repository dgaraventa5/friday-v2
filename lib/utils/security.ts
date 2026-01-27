import { NextResponse } from 'next/server';

/**
 * Verify Origin header to prevent CSRF attacks
 * Returns null if origin is valid, or a 403 response if invalid
 *
 * Security model:
 * - In development: Allow localhost origins
 * - In production: Require NEXT_PUBLIC_SITE_URL or VERCEL_URL to be configured
 * - Requests without origin/referer are allowed (same-origin, server-to-server)
 * - Requests with origin/referer must match allowed origins (fail-closed)
 */
export function verifyOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Allow requests without origin (same-origin requests, server-to-server, curl, etc.)
  // Browsers always send Origin header for cross-origin POST requests
  if (!origin && !referer) {
    return null;
  }

  // Build list of allowed origins
  const allowedOrigins: string[] = [];

  // Always allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000');
    allowedOrigins.push('http://127.0.0.1:3000');
  }

  // Add configured site URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    if (siteUrl.startsWith('http')) {
      allowedOrigins.push(siteUrl);
    } else {
      allowedOrigins.push(`https://${siteUrl}`);
    }
  }

  // Add Vercel URL (automatically set in Vercel deployments)
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    allowedOrigins.push(`https://${vercelUrl}`);
  }

  // Also allow Vercel preview URLs
  const vercelBranchUrl = process.env.VERCEL_BRANCH_URL;
  if (vercelBranchUrl) {
    allowedOrigins.push(`https://${vercelBranchUrl}`);
  }

  // FAIL-CLOSED: If no allowed origins configured in production, reject cross-origin requests
  if (allowedOrigins.length === 0) {
    console.error('[Security] No allowed origins configured. Set NEXT_PUBLIC_SITE_URL or deploy to Vercel.');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  // Check origin header
  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`[Security] Blocked request with invalid origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
    return NextResponse.json(
      { error: 'Invalid origin' },
      { status: 403 }
    );
  }

  // If origin is missing but referer is present, validate referer
  if (!origin && referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = refererUrl.origin;
      if (!allowedOrigins.includes(refererOrigin)) {
        console.warn(`[Security] Blocked request with invalid referer: ${referer}`);
        return NextResponse.json(
          { error: 'Invalid origin' },
          { status: 403 }
        );
      }
    } catch {
      // Invalid referer URL, reject
      return NextResponse.json(
        { error: 'Invalid origin' },
        { status: 403 }
      );
    }
  }

  return null;
}

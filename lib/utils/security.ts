import { NextResponse } from 'next/server';

/**
 * Verify Origin header to prevent CSRF attacks
 * Returns null if origin is valid, or a 403 response if invalid
 *
 * Security model:
 * - Requests without origin/referer are allowed (same-origin, server-to-server)
 * - In development: Allow localhost origins
 * - In production: Compare Origin against Host header (standard CSRF prevention)
 * - Fallback: Check env var allowlist (NEXT_PUBLIC_SITE_URL, VERCEL_URL, etc.)
 */
export function verifyOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Allow requests without origin (same-origin requests, server-to-server, curl, etc.)
  // Browsers always send Origin header for cross-origin POST requests
  if (!origin && !referer) {
    return null;
  }

  // Always allow localhost in development (any port)
  if (process.env.NODE_ENV === 'development') {
    if (origin) {
      try {
        const url = new URL(origin);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          return null;
        }
      } catch {
        // Invalid URL, fall through to normal validation
      }
    }
    if (referer) {
      try {
        const url = new URL(referer);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          return null;
        }
      } catch {
        // Invalid URL, fall through to normal validation
      }
    }
  }

  // Host-header comparison: standard CSRF prevention
  // If Origin matches the Host/X-Forwarded-Host, it's same-origin
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (host && origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) {
        return null;
      }
    } catch {
      // Invalid origin URL, fall through
    }
  }
  if (host && !origin && referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host === host) {
        return null;
      }
    } catch {
      // Invalid referer URL, fall through
    }
  }

  // Build list of additional allowed origins from env vars
  const allowedOrigins: string[] = [];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    let normalized = siteUrl;
    if (!normalized.startsWith('http')) {
      normalized = `https://${normalized}`;
    }
    // Strip trailing slash for consistent comparison
    allowedOrigins.push(normalized.replace(/\/$/, ''));
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    allowedOrigins.push(`https://${vercelUrl}`);
  }

  const vercelBranchUrl = process.env.VERCEL_BRANCH_URL;
  if (vercelBranchUrl) {
    allowedOrigins.push(`https://${vercelBranchUrl}`);
  }

  // Check origin against env-var allowlist
  if (origin) {
    if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
      return null;
    }
  }

  // Check referer against env-var allowlist
  if (!origin && referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (allowedOrigins.length > 0 && allowedOrigins.includes(refererOrigin)) {
        return null;
      }
    } catch {
      // Invalid referer, fall through to rejection
    }
  }

  // If we reach here, the origin is not allowed
  const requestOrigin = origin || (referer ? `referer: ${referer}` : 'unknown');
  console.warn(
    `[Security] Blocked request with invalid origin: ${requestOrigin}. ` +
    `Host: ${host || 'none'}. Allowed: ${allowedOrigins.join(', ') || 'none (no env vars configured)'}`
  );

  return NextResponse.json(
    { error: 'Invalid origin' },
    { status: 403 }
  );
}

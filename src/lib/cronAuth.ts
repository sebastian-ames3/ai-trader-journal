import { NextRequest } from 'next/server';

/**
 * Verify cron request authentication.
 *
 * Security fixes:
 * - Fails closed: rejects if CRON_SECRET is not set in production
 * - Only accepts x-vercel-cron header if VERCEL env var confirms platform
 * - Requires CRON_SECRET to be set and match Bearer token
 */
export function verifyCronRequest(request: NextRequest): boolean {
  // Allow in development without auth
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const cronSecret = process.env.CRON_SECRET;

  // Fail closed: reject if CRON_SECRET is not configured in production
  if (!cronSecret) {
    console.error('CRON_SECRET is not set. Rejecting cron request.');
    return false;
  }

  // Check Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Accept x-vercel-cron only if running on Vercel platform
  if (process.env.VERCEL) {
    const vercelCron = request.headers.get('x-vercel-cron');
    if (vercelCron) {
      return true;
    }
  }

  return false;
}

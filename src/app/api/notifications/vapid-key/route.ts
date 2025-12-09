/**
 * VAPID Public Key API Route
 *
 * GET /api/notifications/vapid-key
 * Returns the VAPID public key for push notification subscription.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return NextResponse.json(
      { error: 'Push notifications not configured' },
      { status: 503 }
    );
  }

  return NextResponse.json({ publicKey });
}

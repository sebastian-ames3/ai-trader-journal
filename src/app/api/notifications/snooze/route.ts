/**
 * Notification Snooze API
 *
 * POST /api/notifications/snooze
 * Snoozes a notification for a specified duration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { snoozeNotification } from '@/lib/notifications';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const body = await request.json();
    const { notificationId, hours = 3 } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const snoozedTo = await snoozeNotification(notificationId, hours);

    return NextResponse.json({ success: true, snoozedTo });
  } catch (error) {
    console.error('Snooze error:', error);
    return NextResponse.json(
      { error: 'Failed to snooze notification' },
      { status: 500 }
    );
  }
}

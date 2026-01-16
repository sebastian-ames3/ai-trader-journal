/**
 * Notification Dismissal Tracking API
 *
 * POST /api/notifications/dismissed
 * Marks a notification as dismissed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { dismissNotification } from '@/lib/notifications';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    await dismissNotification(notificationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Dismissal tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track dismissal' },
      { status: 500 }
    );
  }
}

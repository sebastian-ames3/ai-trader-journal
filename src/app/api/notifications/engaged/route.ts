/**
 * Notification Engagement Tracking API
 *
 * POST /api/notifications/engaged
 * Marks a notification as engaged (clicked).
 */

import { NextRequest, NextResponse } from 'next/server';
import { markNotificationEngaged } from '@/lib/notifications';
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

    await markNotificationEngaged(notificationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Engagement tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track engagement' },
      { status: 500 }
    );
  }
}

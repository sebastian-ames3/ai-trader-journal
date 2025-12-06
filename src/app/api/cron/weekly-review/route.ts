/**
 * Weekly Review Cron Job API Route
 *
 * GET /api/cron/weekly-review
 *
 * Called by Vercel Cron on Sunday at 6 PM ET.
 * Sends weekly review prompts with summary stats.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendAndLogNotification,
  shouldSendNotification,
  getNotificationPrefs,
  NOTIFICATION_COPY,
} from '@/lib/notifications';
import { getWeeklyEntryCount } from '@/lib/marketData';

// Verify cron request
function verifyCronRequest(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const vercelCron = request.headers.get('x-vercel-cron');
  if (vercelCron) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check preferences
    const prefs = await getNotificationPrefs();

    if (!prefs.weeklyReview) {
      return NextResponse.json({
        success: true,
        message: 'Weekly review disabled',
      });
    }

    // Check if we should send notifications
    const shouldSend = await shouldSendNotification('TIME_BASED');

    if (!shouldSend) {
      return NextResponse.json({
        success: true,
        message: 'Notifications disabled or quiet hours',
      });
    }

    // Get weekly stats
    const entryCount = await getWeeklyEntryCount();

    // Generate notification copy
    const copy = NOTIFICATION_COPY.weeklyReview(entryCount);

    // Send notification
    const result = await sendAndLogNotification({
      type: 'TIME_BASED',
      trigger: 'weekly_review',
      title: copy.title,
      body: copy.body,
      url: '/insights',
      data: {
        entryCount,
      },
      actions: [
        { action: 'review', title: 'Start Review' },
        { action: 'later', title: 'Later' },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Weekly review sent',
      entryCount,
      notification: result,
    });
  } catch (error) {
    console.error('Weekly review error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

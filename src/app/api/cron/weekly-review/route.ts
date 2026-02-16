/**
 * Weekly Review Cron Job API Route
 *
 * GET /api/cron/weekly-review
 *
 * Called by Vercel Cron on Sunday at 6 PM ET.
 * Sends weekly review prompts with summary stats to all users.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendAndLogNotification,
  shouldSendNotification,
  getNotificationPrefs,
  NOTIFICATION_COPY,
} from '@/lib/notifications';
import { getWeeklyEntryCount } from '@/lib/marketData';
import { verifyCronRequest } from '@/lib/cronAuth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    let sent = 0;
    let skipped = 0;

    for (const { id: userId } of users) {
      // Check preferences per user
      const prefs = await getNotificationPrefs(userId);

      if (!prefs.weeklyReview) {
        skipped++;
        continue;
      }

      // Check if we should send notifications
      const shouldSend = await shouldSendNotification('TIME_BASED', userId);

      if (!shouldSend) {
        skipped++;
        continue;
      }

      // Get weekly stats for this user
      const entryCount = await getWeeklyEntryCount(userId);

      // Generate notification copy
      const copy = NOTIFICATION_COPY.weeklyReview(entryCount);

      // Send notification
      await sendAndLogNotification({
        type: 'TIME_BASED',
        trigger: 'weekly_review',
        title: copy.title,
        body: copy.body,
        url: '/insights',
        userId,
        data: {
          entryCount,
        },
        actions: [
          { action: 'review', title: 'Start Review' },
          { action: 'later', title: 'Later' },
        ],
      });
      sent++;
    }

    return NextResponse.json({
      success: true,
      message: `Weekly reviews: ${sent} sent, ${skipped} skipped`,
    });
  } catch (error) {
    console.error('Weekly review error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Daily Reminder Cron Job API Route
 *
 * GET /api/cron/daily-reminder
 *
 * Called by Vercel Cron at 4:30 PM ET weekdays.
 * Sends daily end-of-day reflection prompts.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendAndLogNotification,
  shouldSendNotification,
  getNotificationPrefs,
  NOTIFICATION_COPY,
} from '@/lib/notifications';
import { getDaysSinceLastEntry } from '@/lib/marketData';

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

    if (!prefs.dailyReflection) {
      return NextResponse.json({
        success: true,
        message: 'Daily reflection disabled',
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

    // Check for journal silence - if user hasn't journaled in a while
    const daysSinceLastEntry = await getDaysSinceLastEntry();
    const nudgeDays = prefs.journalNudgeDays;

    let copy: { title: string; body: string };
    let trigger: string;

    if (daysSinceLastEntry >= nudgeDays) {
      // Send journal nudge instead of daily reminder
      copy = NOTIFICATION_COPY.journalSilence(daysSinceLastEntry);
      trigger = `journal_silence_${daysSinceLastEntry}d`;
    } else {
      // Send regular daily reminder
      copy = NOTIFICATION_COPY.dailyClose();
      trigger = 'daily_reminder';
    }

    // Send notification
    const result = await sendAndLogNotification({
      type: daysSinceLastEntry >= nudgeDays ? 'JOURNAL_NUDGE' : 'TIME_BASED',
      trigger,
      title: copy.title,
      body: copy.body,
      url: '/journal/new',
      actions: [
        { action: 'voice', title: 'Voice Note' },
        { action: 'quick', title: 'Quick Text' },
        { action: 'dismiss', title: 'Skip' },
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Daily reminder sent',
      trigger,
      notification: result,
    });
  } catch (error) {
    console.error('Daily reminder error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

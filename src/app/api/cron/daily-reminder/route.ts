/**
 * Daily Reminder Cron Job API Route
 *
 * GET /api/cron/daily-reminder
 *
 * Called by Vercel Cron at 4:30 PM ET weekdays.
 * Sends daily end-of-day reflection prompts to all users.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendAndLogNotification,
  shouldSendNotification,
  getNotificationPrefs,
  NOTIFICATION_COPY,
} from '@/lib/notifications';
import { getDaysSinceLastEntry } from '@/lib/marketData';
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

      if (!prefs.dailyReflection) {
        skipped++;
        continue;
      }

      // Check if we should send notifications
      const shouldSend = await shouldSendNotification('TIME_BASED', userId);

      if (!shouldSend) {
        skipped++;
        continue;
      }

      // Check for journal silence - if user hasn't journaled in a while
      const daysSinceLastEntry = await getDaysSinceLastEntry(userId);
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
      await sendAndLogNotification({
        type: daysSinceLastEntry >= nudgeDays ? 'JOURNAL_NUDGE' : 'TIME_BASED',
        trigger,
        title: copy.title,
        body: copy.body,
        url: '/journal/new',
        userId,
        actions: [
          { action: 'voice', title: 'Voice Note' },
          { action: 'quick', title: 'Quick Text' },
          { action: 'dismiss', title: 'Skip' },
        ],
      });
      sent++;
    }

    return NextResponse.json({
      success: true,
      message: `Daily reminders: ${sent} sent, ${skipped} skipped`,
    });
  } catch (error) {
    console.error('Daily reminder error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
